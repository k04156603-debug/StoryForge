const config = require('../config');
const logger = require('../utils/logger');
const net = require('net');

let prdQueue = null;
let prdWorker = null;
let queueEnabled = false;

/**
 * Check if Redis is reachable before initializing BullMQ
 */
const checkRedis = (host, port, timeout = 2000) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
};

const initQueue = async () => {
  const redisAvailable = await checkRedis(config.redis.host, config.redis.port);

  if (!redisAvailable) {
    logger.warn('Redis not available — BullMQ queue disabled. Processing will run directly.');
    logger.warn('Install Redis locally or via Docker to enable async job processing.');
    return null;
  }

  try {
    const { Queue, Worker } = require('bullmq');
    const prdService = require('../services/prd.service');

    const connection = {
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: 3,
    };

    prdQueue = new Queue('prd-processing', { connection });

    prdWorker = new Worker(
      'prd-processing',
      async (job) => {
        logger.info(`Processing job ${job.id} for PRD ${job.data.prdId}`);
        await prdService.processPrd(job.data.prdId);
      },
      {
        connection,
        concurrency: 2,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    prdWorker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    prdWorker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed:`, err.message);
    });

    queueEnabled = true;
    logger.info('BullMQ queue initialized with Redis');
    return prdQueue;
  } catch (error) {
    logger.warn('BullMQ initialization failed:', error.message);
    return null;
  }
};

const addProcessingJob = async (prdId) => {
  if (!queueEnabled || !prdQueue) {
    // Fallback: process directly without queue
    logger.info('Queue not available, processing directly');
    const prdService = require('../services/prd.service');
    return prdService.processPrd(prdId);
  }

  const job = await prdQueue.add('process-prd', { prdId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });

  return job;
};

const closeQueue = async () => {
  if (prdWorker) await prdWorker.close();
  if (prdQueue) await prdQueue.close();
};

module.exports = { initQueue, addProcessingJob, closeQueue };
