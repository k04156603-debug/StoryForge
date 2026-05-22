const express = require('express');
const prdRoutes = require('./prd.routes');
const storyRoutes = require('./story.routes');
const analysisRoutes = require('./analysis.routes');
const exportRoutes = require('./export.routes');
const authRoutes = require('./auth.routes');
const mongoose = require('mongoose');
const connectDatabase = require('../config/database');

const router = express.Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Story Forge API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Diagnostics endpoint – shows DB connection status and last error
router.get('/diagnostics', (req, res) => {
  const state = mongoose.connection.readyState;
  const lastErrObj = typeof connectDatabase.getLastError === 'function' ? connectDatabase.getLastError() : null;
  const lastError = lastErrObj ? lastErrObj.message : null;
  res.json({
    success: true,
    connectionState: state,
    lastError,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/prd', prdRoutes);
router.use('/stories', storyRoutes);
router.use('/analysis', analysisRoutes);
router.use('/export', exportRoutes);

module.exports = router;
