const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const config = require('../config');

// ── Local auth ────────────────────────────────────────────────────────────────
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

// ── Sessions (devices) ────────────────────────────────────────────────────────
router.get('/sessions', protect, authController.getSessions);
router.delete('/sessions', protect, authController.revokeAllSessions);
router.delete('/sessions/:id', protect, authController.revokeSession);
router.patch('/update-password', protect, authController.updatePassword);

// ── Password Reset ────────────────────────────────────────────────────────────
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return res.status(400).json({
      success: false,
      message: 'Google login is not configured in Vercel. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!config.google.clientId || !config.google.clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Google login is not configured in Vercel.'
      });
    }
    passport.authenticate('google', { session: false, failureRedirect: '/login' })(req, res, next);
  },
  authController.googleCallback
);

module.exports = router;