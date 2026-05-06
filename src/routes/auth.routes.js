const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// ── Local auth ────────────────────────────────────────────────────────────────
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

// ── Sessions (devices) ────────────────────────────────────────────────────────
router.get('/sessions', protect, authController.getSessions);
router.delete('/sessions', protect, authController.revokeAllSessions);
router.delete('/sessions/:id', protect, authController.revokeSession);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);

module.exports = router;