const { createClient } = require('redis');
const logger = require('./logger');

/********************  内存缓存作为降级  ************************/ 
const memoryCache = new Map();
const setMem = (key, value, ttl) => {
  memoryCache.set(key, { value, exp: Date.now() + ttl * 1000 });
};
const getMem = (key) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.exp) { memoryCache.delete(key); return null; }
  return item.value;
};
/***************************************************************/

let redisClient;
(async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (e) => logger.error('Redis error: %s', e.message));
    await redisClient.connect();
    logger.info('Redis connected: %s', redisUrl);
  } catch (e) {
    logger.error('Redis init failed -> fallback to memory cache: %s', e.message);
  }
})();

async function getCache(key) {
  // Redis 优先
  if (redisClient?.isReady) {
    try {
      const val = await redisClient.get(key);
      if (val) return JSON.parse(val);
    } catch (e) { logger.warn('Redis get %s err: %s', key, e.message); }
  }
  return getMem(key);
}

async function setCache(key, value, ttl = 60) {
  if (redisClient?.isReady) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (e) { logger.warn('Redis set %s err: %s', key, e.message); }
  }
  setMem(key, value, ttl);
}

module.exports = { getCache, setCache };