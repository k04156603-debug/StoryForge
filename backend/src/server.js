const app = require('./app');
const config = require('./config');
const connectDatabase = require('./config/database');
const { initQueue, closeQueue } = require('./queue/worker');
const logger = require('./utils/logger');

const startServer = async () => {
  // Connect to MongoDB
  await connectDatabase();

  // Initialize BullMQ queue (non-blocking, works without Redis)
  initQueue();

  // Start Express server
  const server = app.listen(config.port, () => {
    logger.info(`🚀 Story Forge API running on port ${config.port} (${config.env})`);
    logger.info(`📡 API: http://localhost:${config.port}/api/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await closeQueue();
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    shutdown('UNHANDLED_REJECTION');
  });
};

startServer();
