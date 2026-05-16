const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const morganMiddleware = require('./middleware/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const config = require('./config');

// Load passport Google strategy
require('./config/passport');

const app = express();

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
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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