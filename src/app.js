const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const morganMiddleware = require('./middleware/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const config = require('./config');
const connectDatabase = require('./config/database');

// Load passport Google strategy
require('./config/passport');

const app = express();

// ─── DB Readiness (critical for Vercel serverless cold starts) ────
let dbPromise = null;
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  try {
    if (!dbPromise) {
      dbPromise = connectDatabase().catch(err => {
        dbPromise = null;
        throw err;
      });
    }
    await dbPromise;
    next();
  } catch (err) {
    console.error('DB middleware connection error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please retry.',
    });
  }
});

// ─── Trust Proxy (required for Render/Heroku/Railway) ────
app.set('trust proxy', 1);

// ─── Passport ────────────────────────────────────
app.use(passport.initialize());

// ─── Security ────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Compression ─────────────────────────────────
app.use(compression());

// ─── Logging ─────────────────────────────────────
app.use(morganMiddleware);

// ─── Rate Limiting ───────────────────────────────
app.use('/api', apiLimiter);

// ─── Routes ──────────────────────────────────────
app.use('/api', routes);
app.use('/', routes); // Vercel Serverless fallback (Vercel sometimes strips /api)

// ─── 404 Handler ─────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Error Handler ───────────────────────────────
app.use(errorHandler);

module.exports = app;