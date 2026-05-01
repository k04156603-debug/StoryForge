const express = require('express');
const prdRoutes = require('./prd.routes');
const storyRoutes = require('./story.routes');
const analysisRoutes = require('./analysis.routes');
const exportRoutes = require('./export.routes');
const authRoutes = require('./auth.routes');

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

// Mount routes
router.use('/auth', authRoutes);
router.use('/prd', prdRoutes);
router.use('/stories', storyRoutes);
router.use('/analysis', analysisRoutes);
router.use('/export', exportRoutes);

module.exports = router;
