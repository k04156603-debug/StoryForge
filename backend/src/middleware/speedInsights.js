const { injectSpeedInsights } = require('@vercel/speed-insights');
const logger = require('../utils/logger');

/**
 * Speed Insights middleware for Express
 * Note: Speed Insights is primarily designed for frontend web vitals tracking.
 * This middleware provides configuration that can be used if the backend serves HTML pages.
 */
const speedInsightsMiddleware = (req, res, next) => {
  // Speed Insights is primarily for frontend tracking
  // This middleware makes the configuration available if needed
  
  // Store Speed Insights configuration on the app for potential use
  if (!req.app.get('speedInsightsInitialized')) {
    try {
      // Initialize Speed Insights with default configuration
      const speedInsights = injectSpeedInsights({
        framework: 'express',
        debug: process.env.NODE_ENV !== 'production',
        sampleRate: 1, // Track 100% of events
      });
      
      req.app.set('speedInsightsInitialized', true);
      req.app.set('speedInsights', speedInsights);
      
      logger.info('Speed Insights initialized for Express backend');
    } catch (error) {
      logger.warn('Speed Insights initialization skipped:', error.message);
    }
  }
  
  next();
};

module.exports = speedInsightsMiddleware;
