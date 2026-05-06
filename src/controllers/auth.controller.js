const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const ApiError = require('../utils/ApiError');
const config = require('../config');

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
    const currentToken = req.headers.authorization?.split(' ')[1];
    const sessions = await Session.find({ user: req.user._id }).sort({ lastActive: -1 });

    const data = sessions.map((s) => ({
      id: s._id,
      device: s.device,
      browser: s.browser,
      os: s.os,
      ip: s.ip,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: s.token === currentToken,
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
    const currentToken = req.headers.authorization?.split(' ')[1];
    await Session.deleteMany({ user: req.user._id, token: { $ne: currentToken } });
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

    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  } catch {
    res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
  }
};