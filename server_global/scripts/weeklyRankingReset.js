const cron = require('node-cron');
const User = require('../models/User');
const { getRedisClient } = require('../utils/cache');
const logger = require('../utils/logger');

function scheduleRankingReset(){
  // 每周一 00:00 UTC (cron: min hour day month weekday)
  cron.schedule('0 0 * * 1', async ()=>{
    try{
      logger.info('开始清空周排行榜');
      // 清空 Redis 缓存
      const redis = getRedisClient();
      if(redis?.isReady){
        const keys = await redis.keys('rankings:*');
        if(keys.length) await redis.del(keys);
      }
      // 清空与周榜相关的字段，可按需要扩展
      await User.updateMany({}, { $set: { 'statistics.weeklyGold': 0, 'statistics.weeklyFish': 0 } });
      logger.info('周排行榜已重置');
    }catch(err){
      logger.error('重置排行榜失败: %s', err.message);
    }
  });
}

module.exports = { scheduleRankingReset };