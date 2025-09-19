const redis = require('redis');
const logger = require('../utils/logger');
const config = require('../config/appConfig');

let client;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      host: config.REDIS_HOST || 'localhost',
      port: config.REDIS_PORT || 6379,
      password: config.REDIS_PASSWORD || undefined,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    await client.connect();
    return client;
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
};

module.exports = {
  connectRedis,
  getRedisClient
};
