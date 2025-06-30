const { createClient } = require('redis');
const logger = require('./logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => logger.error('Redis error: %s', err.message));

(async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
    logger.info('Redis connected: %s', redisUrl);
  } catch (err) {
    logger.error('Redis connect failed: %s', err.message);
  }
})();

async function getCache(key) {
  try {
    if (!redisClient.isReady) return null;
    return await redisClient.get(key);
  } catch (err) {
    logger.warn('Redis get error for key %s: %s', key, err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 60) {
  try {
    if (!redisClient.isReady) return;
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn('Redis set error for key %s: %s', key, err.message);
  }
}

module.exports = { redisClient, getCache, setCache };