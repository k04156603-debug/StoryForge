const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const config = require('../config');

// Make sure passport strategy is loaded
require('../config/passport');

const router = express.Router();

// ─── Email/Password Auth ─────────────────────────────────
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

// ─── Google OAuth ────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${config.frontendUrl}/login?error=google_failed`, session: false }),
  (req, res) => {
    // Generate JWT for the user
    const token = jwt.sign({ id: req.user._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn || '7d',
    });

    // Redirect to frontend with token
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  }
);

module.exports = router;