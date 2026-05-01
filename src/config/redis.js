const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

let redisClient = null;

const getRedisClient = () => {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis unavailable after 3 retries, giving up');
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', () => {
      // Silently ignore — already handled by retryStrategy
    });

    return redisClient;
  } catch (error) {
    logger.warn('Redis unavailable, caching disabled');
    return null;
  }
};

module.exports = { getRedisClient };
