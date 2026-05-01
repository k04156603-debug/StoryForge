const rateLimit = require('express-rate-limit');
const config = require('../config');

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // suppresses proxy warning
  message: {
    success: false,
    status: 'fail',
    message: 'Too many requests. Please try again later.',
  },
});

// Stricter limiter for AI processing endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // suppresses proxy warning
  message: {
    success: false,
    status: 'fail',
    message: 'AI processing rate limit exceeded. Please try again later.',
  },
});

module.exports = { apiLimiter, aiLimiter };
