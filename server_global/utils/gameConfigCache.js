const GameConfig = require('../models/GameConfig');
const { getCache, setCache } = require('./cache');

async function getConfig(type) {
  const cacheKey = `gameConfig:${type}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  const configDoc = await GameConfig.getActiveConfig ? GameConfig.getActiveConfig(type) : await GameConfig.findOne({ configType: type, isActive: true });
  if (configDoc) {
    await setCache(cacheKey, configDoc, 300); // 5 min TTL
  }
  return configDoc;
}

module.exports = { getConfig };