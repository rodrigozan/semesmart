import Profile from '../models/Profile.js';

/**
 * Ensures the request has an authenticated session.
 * Returns 401 if not authenticated.
 */
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

/**
 * Verifies that req.user is the owner of the profile or is listed in profile.members.
 * Expects req.params.profileId to be set.
 * Attaches the profile to req.profile on success.
 * Returns 403 if access is denied.
 */
export async function hasProfileAccess(req, res, next) {
  try {
    const profile = await Profile.findById(req.params.profileId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const userId = req.user._id.toString();
    const isOwner = profile.owner.toString() === userId;
    const isMember = profile.members.some((m) => m.user.toString() === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.profile = profile;
    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

/**
 * Must run after hasProfileAccess.
 * Verifies that req.user has write permission on req.profile.
 * Owner always has write access; members need canWrite === true.
 * Returns 403 if write permission is not granted.
 */
export function canWrite(req, res, next) {
  if (!req.user || !req.profile) {
    return res.status(500).json({ error: 'canWrite called without prior isAuthenticated + hasProfileAccess' });
  }

  const userId = req.user._id.toString();
  const profile = req.profile;

  const isOwner = profile.owner.toString() === userId;
  if (isOwner) {
    return next();
  }

  const member = profile.members.find((m) => m.user.toString() === userId);
  if (member && member.canWrite === true) {
    return next();
  }

  return res.status(403).json({ error: 'Write access denied' });
}
