const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const OTP = require('../models/OTP');
const ApiError = require('../utils/ApiError');
const config = require('../config');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

// ── Helper: parse UA string ──────────────────────────────────────────────────
function parseUA(uaString = '') {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Browser detection
  if (/Edg\//.test(uaString)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(uaString)) browser = 'Opera';
  else if (/Chrome\//.test(uaString)) browser = 'Chrome';
  else if (/Firefox\//.test(uaString)) browser = 'Firefox';
  else if (/Safari\//.test(uaString) && !/Chrome/.test(uaString)) browser = 'Safari';

  // OS detection
  if (/Windows NT/.test(uaString)) os = 'Windows';
  else if (/Mac OS X/.test(uaString)) os = 'macOS';
  else if (/Linux/.test(uaString)) os = 'Linux';
  else if (/Android/.test(uaString)) os = 'Android';
  else if (/iPhone|iPad/.test(uaString)) os = 'iOS';

  // Device type
  if (/Mobile|Android|iPhone/.test(uaString)) device = 'Mobile';
  else if (/iPad|Tablet/.test(uaString)) device = 'Tablet';

  return { browser, os, device };
}

// ── Sign token ───────────────────────────────────────────────────────────────
function signToken(userId) {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

// ── POST /api/auth/signup ────────────────────────────────────────────────────
exports.signup = async (req, res, next) => {
  try {
    console.log('[DEBUG] Signup request body:', req.body);
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      throw new ApiError(400, 'Name, email and password are required');

    const exists = await User.findOne({ email });
    if (exists) throw new ApiError(400, 'User already exists with this email');

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    // Save session
    const { browser, os, device } = parseUA(req.headers['user-agent']);
    await Session.create({
      user: user._id,
      token,
      browser,
      os,
      device,
      ip: req.ip || '',
    });

    res.status(201).json({
      success: true,
      token,
      data: { user: { id: user._id, name: user.name, email: user.email } },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new ApiError(400, 'Email and password are required');

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      throw new ApiError(401, 'Invalid email or password');

    const token = signToken(user._id);

    // Save session
    const { browser, os, device } = parseUA(req.headers['user-agent']);
    await Session.create({
      user: user._id,
      token,
      browser,
      os,
      device,
      ip: req.ip || '',
    });

    res.json({
      success: true,
      token,
      data: { user: { id: user._id, name: user.name, email: user.email } },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/sessions ───────────────────────────────────────────────────
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).sort({ lastActive: -1 });
    const data = sessions.map((s) => ({
      id: s._id,
      device: s.device,
      browser: s.browser,
      os: s.os,
      ip: s.ip,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: s.token === req.token,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/auth/sessions/:id ────────────────────────────────────────────
exports.revokeSession = async (req, res, next) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!session) throw new ApiError(404, 'Session not found');
    res.json({ success: true, message: 'Session revoked' });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/auth/sessions ─────────────────────────────────────────────────
exports.revokeAllSessions = async (req, res, next) => {
  try {
    await Session.deleteMany({ user: req.user._id, token: { $ne: req.token } });
    res.json({ success: true, message: 'All other sessions revoked' });
  } catch (err) {
    next(err);
  }
};

// ── Google OAuth callback ────────────────────────────────────────────────────
exports.googleCallback = async (req, res) => {
  try {
    const token = signToken(req.user._id);

    const { browser, os, device } = parseUA(req.headers['user-agent']);
    await Session.create({
      user: req.user._id,
      token,
      browser,
      os,
      device,
      ip: req.ip || '',
    });

    const name = encodeURIComponent(req.user.name || '');
    const email = encodeURIComponent(req.user.email || '');
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}&name=${name}&email=${email}`);
  } catch {
    res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
  }
};

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required');

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, 'User not found with this email');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to DB
    await OTP.deleteMany({ email }); // Clear previous
    await OTP.create({ email, otp, expiresAt });

    // Send Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP - Story Forge',
        message: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #c4713b;">Story Forge Security</h2>
            <p>You requested a password reset. Please use the following One-Time Password (OTP) to continue:</p>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #1a1a1a; margin: 20px 0;">${otp}</div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Email error (non-blocking):', err);
      // We don't throw here so the user can still get the OTP via debug/logs if needed
    }

    res.json({ 
      success: true, 
      message: 'OTP sent to your email'
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ApiError(400, 'Email and OTP are required');

    const record = await OTP.findOne({ email, otp });
    if (!record) throw new ApiError(400, 'Invalid or expired OTP');

    record.verified = true;
    await record.save();

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/reset-password ────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) throw new ApiError(400, 'Email, OTP and new password are required');

    const record = await OTP.findOne({ email, otp, verified: true });
    if (!record) throw new ApiError(400, 'OTP not verified or expired');

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, 'User not found');

    // Update password
    user.password = password;
    await user.save();

    // Delete OTP record
    await OTP.deleteMany({ email });

    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/auth/update-password ──────────────────────────────────────────
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      throw new ApiError(400, 'Current and new password are required');

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      throw new ApiError(401, 'Current password is incorrect');

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};