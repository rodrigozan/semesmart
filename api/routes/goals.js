import { Router } from 'express';
import Goal from '../models/Goal.js';
import { isAuthenticated, hasProfileAccess, canWrite } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// All goal routes are scoped under /api/profiles/:profileId/goals.
// mergeParams: true ensures :profileId from the parent router is available here.

const readGuard = [isAuthenticated, hasProfileAccess];
const writeGuard = [isAuthenticated, hasProfileAccess, canWrite];

// ─── GET /api/profiles/:profileId/goals ──────────────────────────────────────
// List all goals for the profile, sorted by newest first.

router.get('/', readGuard, async (req, res) => {
  try {
    const { profileId } = req.params;

    const rawGoals = await Goal.find({ profile: profileId })
      .sort({ createdAt: -1 })
      .lean();

    const goals = rawGoals.map((g) => ({ ...g, id: g._id.toString() }));

    return res.json({ data: goals, total: goals.length });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── POST /api/profiles/:profileId/goals ─────────────────────────────────────
// Create a new financial goal.

router.post('/', writeGuard, async (req, res) => {
  try {
    const { profileId } = req.params;
    const { name, targetAmount, currentAmount, deadline, illustration } = req.body;

    if (!name || targetAmount === undefined) {
      return res.status(400).json({ error: 'Os campos name e targetAmount são obrigatórios.' });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({ error: 'O campo targetAmount deve ser positivo.' });
    }

    const resolvedCurrentAmount = currentAmount ?? 0;

    // Auto-complete if the initial amount already meets the target.
    const status = resolvedCurrentAmount >= targetAmount ? 'completed' : 'active';

    const goal = await Goal.create({
      profile: profileId,
      createdBy: req.user._id,
      name,
      targetAmount,
      currentAmount: resolvedCurrentAmount,
      deadline: deadline ? new Date(deadline) : undefined,
      illustration: illustration || '🎯',
      status,
    });

    return res.status(201).json({ data: goal });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── PUT /api/profiles/:profileId/goals/:id ──────────────────────────────────
// Update a goal. Auto-completes when currentAmount reaches targetAmount.

router.put('/:id', writeGuard, async (req, res) => {
  try {
    const { profileId, id } = req.params;
    const {
      name,
      targetAmount,
      currentAmount,
      deadline,
      illustration,
      status,
    } = req.body;

    if (targetAmount !== undefined && targetAmount <= 0) {
      return res.status(400).json({ error: 'O campo targetAmount deve ser positivo.' });
    }

    // Fetch current state to evaluate auto-completion correctly.
    const existing = await Goal.findOne({ _id: id, profile: profileId });
    if (!existing) {
      return res.status(404).json({ error: 'Meta não encontrada.' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (illustration !== undefined) updates.illustration = illustration;
    if (deadline !== undefined) updates.deadline = new Date(deadline);

    const resolvedTarget =
      targetAmount !== undefined ? targetAmount : existing.targetAmount;
    const resolvedCurrent =
      currentAmount !== undefined ? currentAmount : existing.currentAmount;

    if (targetAmount !== undefined) updates.targetAmount = resolvedTarget;
    if (currentAmount !== undefined) updates.currentAmount = resolvedCurrent;

    // Auto-complete when the current amount meets or exceeds the target.
    if (resolvedCurrent >= resolvedTarget) {
      updates.status = 'completed';
    } else if (status !== undefined) {
      const VALID_STATUSES = ['active', 'completed', 'paused'];
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Status inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`,
        });
      }
      updates.status = status;
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: id, profile: profileId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada.' });
    }

    return res.json({ data: goal });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── DELETE /api/profiles/:profileId/goals/:id ───────────────────────────────
// Delete a goal. Scoped to profile.

router.delete('/:id', writeGuard, async (req, res) => {
  try {
    const { profileId, id } = req.params;

    const goal = await Goal.findOneAndDelete({ _id: id, profile: profileId });

    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada.' });
    }

    return res.json({ data: { message: 'Meta removida com sucesso.' } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
