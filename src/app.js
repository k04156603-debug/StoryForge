const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const morganMiddleware = require('./middleware/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const config = require('./config');

const app = express();

// ─── Trust Proxy (required for Render/Heroku/Railway) ────
app.set('trust proxy', 1);

// ─── Security ────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
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
