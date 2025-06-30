const { createClient } = require('redis');
const logger = require('./logger');
const config = require('./config');

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

function initRedis() {
  const redisUrl = config.redisUrl;
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        // 线性退避，最大 3 秒
        const delay = Math.min(retries * 100, 3000);
        logger.warn('Redis 尝试重连，第 %d 次，%d ms 后', retries, delay);
        return delay;
      }
    }
  });

  redisClient.on('ready', () => logger.info('Redis 准备就绪'));
  redisClient.on('end', () => logger.warn('Redis 连接已关闭'));
  redisClient.on('reconnecting', () => logger.warn('Redis 重新连接中...'));
  redisClient.on('error', (err) => logger.error('Redis 错误: %s', err.message));

  redisClient.connect().catch((err) => {
    logger.error('Redis 连接失败，将使用内存缓存: %s', err.message);
  });
}

initRedis();

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
module.exports.getRedisClient = () => redisClient;