import { Router } from 'express';
import passport from '../config/passport.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initiate Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  (req, res) => {
    res.redirect(FRONTEND_URL);
  }
);

// Return currently authenticated user with freshly populated profiles
// Re-fetches from DB to avoid stale session data (e.g. newly added profiles)
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const raw = await User.findById(req.user._id).populate('profiles').lean();
    if (!raw) {
      return res.status(401).json({ error: 'User not found' });
    }
    const normalizeId = (doc) => doc ? { ...doc, id: doc._id.toString() } : doc;
    const user = {
      ...normalizeId(raw),
      profiles: (raw.profiles || []).map(normalizeId),
    };
    return res.json({ data: user });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Logout and destroy session
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });
});

export default router;
