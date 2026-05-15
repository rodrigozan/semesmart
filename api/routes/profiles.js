import { Router } from 'express';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { isAuthenticated, hasProfileAccess } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/profiles ────────────────────────────────────────────────────────
// List all profiles the logged user owns or is a member of.

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;

    const profiles = await Profile.find({
      $or: [
        { owner: userId },
        { 'members.user': userId },
      ],
    }).populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    return res.json({ data: profiles });
  } catch (err) {
    console.error('Erro ao listar perfis:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── GET /api/profiles/:profileId ────────────────────────────────────────────
// Get single profile details. Access-guarded.

router.get('/:profileId', isAuthenticated, hasProfileAccess, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.profileId)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    return res.json({ data: profile });
  } catch (err) {
    console.error('Erro ao criar perfil:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── POST /api/profiles ───────────────────────────────────────────────────────
// Create a new profile. Owner role required.

router.post('/', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Apenas usuários com papel de owner podem criar perfis.' });
    }

    const { name, avatar, color } = req.body;

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'O campo name é obrigatório.' });
    }

    // Generate a slug from name + timestamp to guarantee uniqueness.
    const baseSlug = trimmedName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now()}`;

    const profile = await Profile.create({
      name: trimmedName,
      slug,
      owner: req.user._id,
      avatar: avatar || '💰',
      color: color || '#7B2FBE',
    });

    // Associate profile with the user's profile list.
    await User.findByIdAndUpdate(req.user._id, {
      $push: { profiles: profile._id },
    });

    return res.status(201).json({ data: profile });
  } catch (err) {
    console.error('Erro buscar perfil único:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── PUT /api/profiles/:profileId ────────────────────────────────────────────
// Edit profile metadata. Owner only.

router.put('/:profileId', isAuthenticated, hasProfileAccess, async (req, res) => {
  try {
    const profile = req.profile;
    const userId = req.user._id.toString();

    if (profile.owner.toString() !== userId) {
      return res.status(403).json({ error: 'Apenas o owner pode editar este perfil.' });
    }

    const { name, avatar, color } = req.body;
    if (name !== undefined && name.trim().length === 0) {
      return res.status(400).json({ error: 'O campo name não pode ser vazio.' });
    }
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (avatar !== undefined && typeof avatar === 'string') updates.avatar = avatar.trim();
    if (color !== undefined && typeof color === 'string') updates.color = color.trim();

    const updated = await Profile.findByIdAndUpdate(
      profile._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('owner', 'name avatar email')
     .populate('members.user', 'name avatar email');

    return res.json({ data: updated });
  } catch (err) {
    console.error('Erro ao editar perfil:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── POST /api/profiles/:profileId/invite ────────────────────────────────────
// Invite a member by email. Owner only.

router.post('/:profileId/invite', isAuthenticated, hasProfileAccess, async (req, res) => {
  try {
    const profile = req.profile;
    const userId = req.user._id.toString();

    if (profile.owner.toString() !== userId) {
      return res.status(403).json({ error: 'Apenas o owner pode convidar membros.' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'O campo email é obrigatório.' });
    }

    const invitee = await User.findOne({ email: email.toLowerCase().trim() });
    if (!invitee) {
      return res.status(404).json({
        error: 'Usuário não encontrado. Peça que ele entre no app primeiro.',
      });
    }

    // Prevent owner from being added as a member.
    if (invitee._id.toString() === userId) {
      return res.status(400).json({ error: 'O owner já tem acesso a este perfil.' });
    }

    // Prevent duplicate membership.
    const alreadyMember = profile.members.some(
      (m) => m.user.toString() === invitee._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ error: 'Este usuário já é membro do perfil.' });
    }

    profile.members.push({ user: invitee._id, canWrite: true });
    await profile.save();

    // Also track the profile on the invitee's user document.
    await User.findByIdAndUpdate(invitee._id, {
      $addToSet: { profiles: profile._id },
    });

    const updated = await Profile.findById(profile._id)
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');

    return res.json({ data: updated });
  } catch (err) {
    console.error('Erro ao convidar membro:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── DELETE /api/profiles/:profileId/members/:userId ─────────────────────────
// Remove a member. Owner only.

router.delete('/:profileId/members/:userId', isAuthenticated, hasProfileAccess, async (req, res) => {
  try {
    const profile = req.profile;
    const requesterId = req.user._id.toString();

    if (profile.owner.toString() !== requesterId) {
      return res.status(403).json({ error: 'Apenas o owner pode remover membros.' });
    }

    const targetUserId = req.params.userId;

    // Prevent removing the owner.
    if (profile.owner.toString() === targetUserId) {
      return res.status(400).json({ error: 'Não é possível remover o owner do perfil.' });
    }

    const memberExists = profile.members.some(
      (m) => m.user.toString() === targetUserId
    );
    if (!memberExists) {
      return res.status(404).json({ error: 'Membro não encontrado neste perfil.' });
    }

    await Profile.findByIdAndUpdate(profile._id, {
      $pull: { members: { user: targetUserId } },
    });

    // Remove the profile from the removed user's list.
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { profiles: profile._id },
    });

    return res.json({ data: { message: 'Membro removido com sucesso.' } });
  } catch (err) {
    console.error('Erro ao remover membro:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
