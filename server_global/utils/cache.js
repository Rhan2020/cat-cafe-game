const { createClient } = require('redis');
const logger = require('./logger');
const config = require('./config');
const promClient = require('prom-client');

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

// Prometheus 指标
const redisFailureCounter = new promClient.Counter({
  name: 'redis_operation_failures_total',
  help: 'Redis 操作失败次数',
  labelNames: ['method']
});
const redisReconnectCounter = new promClient.Counter({
  name: 'redis_reconnect_total',
  help: 'Redis 重连尝试次数'
});

// Circuit Breaker 参数
const MAX_FAILURES = parseInt(process.env.REDIS_MAX_FAILURES || 5);
const BREAKER_TTL = parseInt(process.env.REDIS_BREAKER_TTL || 120); // seconds

let consecutiveFailures = 0;
let breakerOpenUntil = 0;

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
  redisClient.on('reconnecting', () => {
    logger.warn('Redis 重新连接中...');
    redisReconnectCounter.inc();
  });
  redisClient.on('error', (err) => logger.error('Redis 错误: %s', err.message));

  redisClient.connect().catch((err) => {
    logger.error('Redis 连接失败，将使用内存缓存: %s', err.message);
  });
}

initRedis();

const RECHECK_INTERVAL = 60 * 1000; // 1分钟
// 定时自检，如果 Redis 不可用则尝试重连
setInterval(async () => {
  if (!redisClient?.isReady) {
    try {
      await redisClient.connect();
      logger.info('自检：Redis 已重新连接');
    } catch (err) {
      logger.warn('自检：Redis 仍不可用: %s', err.message);
    }
  }
}, RECHECK_INTERVAL);

async function getCache(key) {
  // Redis 优先
  if (redisClient?.isReady && Date.now() > breakerOpenUntil) {
    try {
      const val = await redisClient.get(key);
      if (val) return JSON.parse(val);
    } catch (e) {
      logger.warn('Redis get %s err: %s', key, e.message);
      redisFailureCounter.inc({ method: 'get' });
      handleFailure();
    }
  }
  return getMem(key);
}

async function setCache(key, value, ttl = 60) {
  if (redisClient?.isReady && Date.now() > breakerOpenUntil) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      consecutiveFailures = 0; // 成功写入重置
    } catch (e) {
      logger.warn('Redis set %s err: %s', key, e.message);
      redisFailureCounter.inc({ method: 'set' });
      handleFailure();
    }
  }
  setMem(key, value, ttl);
}

function handleFailure() {
  consecutiveFailures += 1;
  if (consecutiveFailures >= MAX_FAILURES) {
    breakerOpenUntil = Date.now() + BREAKER_TTL * 1000;
    logger.error('Redis CircuitBreaker 打开，%d 秒内不再尝试', BREAKER_TTL);
    consecutiveFailures = 0;
  }
}

module.exports = { getCache, setCache };
module.exports.getRedisClient = () => redisClient;