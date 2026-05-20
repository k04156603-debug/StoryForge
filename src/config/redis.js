
const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

let redisClient = null;

const getRedisClient = () => {
  if (redisClient) return redisClient;

  try {
    const commonOpts = {
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
    };

    if (config.redis.url) {
      redisClient = new Redis(config.redis.url, commonOpts);
    } else {
      redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        ...commonOpts,
      });
    }

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
