const Animal = require('../models/Animal');
const logger = require('./logger');

/**
 * 根据玩家上次活跃时间与当前经营配置计算离线金币收益。
 * 简化实现：
 *   1. 计算离线分钟数 (max 12h)。
 *   2. 基础产出 = 店铺等级 * 10 gold / min。
 *   3. 岗位加成：每只处于 working 状态的动物 +其 cooking 属性 * 0.5 gold/min。
 *   4. 返回总收益并不直接写库，由调用方负责落库。
 * @param {import('../models/User')} user
 * @returns {Promise<number>} 计算得到的金币数
 */
async function calculateOfflineEarnings(user) {
  try {
    const now = Date.now();
    const lastActive = user.lastActiveAt ? user.lastActiveAt.getTime() : now;
    let minutes = Math.floor((now - lastActive) / 60000);
    if (minutes <= 0) return 0;

    // 限制最长 12 小时离线收益，防止无限累积
    const MAX_MINUTES = 12 * 60;
    if (minutes > MAX_MINUTES) minutes = MAX_MINUTES;

    const baseRate = (user.shop?.level || 1) * 10; // gold/min

    // 设施加成
    const facilities = user.shop?.facilities || {};
    const facilityConfigDoc = await require('./gameConfigCache').getConfig('facility_upgrades');
    let facilityBonusRate = 0;
    if (facilityConfigDoc && facilityConfigDoc.data) {
      for (const [fid, lvl] of Object.entries(facilities)) {
        const cfg = facilityConfigDoc.data.find(f => f.id === fid);
        if (cfg) {
          const levelCfg = cfg.levels.find(l => l.level === lvl);
          if (levelCfg?.productionBonus) facilityBonusRate += levelCfg.productionBonus; // gold/min
        }
      }
    }

    // 查询工作中的动物
    const workers = await Animal.find({ ownerId: user._id, status: 'working' }, 'attributes.cooking breedId').lean();

    // 稀有度加成
    const breedConfigDoc = await require('./gameConfigCache').getConfig('animal_breeds');
    const rarityMultiplierMap = { 'N': 1, 'R': 1.1, 'SR': 1.25, 'SSR': 1.5, 'UR': 2 };

    const workerBonusRate = workers.reduce((sum, a) => {
      const base = (a.attributes?.cooking || 0) * 0.5;
      let multiplier = 1;
      if (breedConfigDoc?.data) {
        const breedInfo = breedConfigDoc.data.find(b => b.breedId === a.breedId);
        if (breedInfo) multiplier = rarityMultiplierMap[breedInfo.rarity] || 1;
      }
      return sum + base * multiplier;
    }, 0);

    const earningsPerMin = baseRate + workerBonusRate + facilityBonusRate;
    const total = earningsPerMin * minutes;

    logger.info('Offline earnings calculated for user %s: %d gold (%d min, rate %d)', user._id, total, minutes, earningsPerMin);

    return Math.floor(total);
  } catch (err) {
    logger.error('Error calculating offline earnings for user %s: %s', user._id, err.message);
    return 0;
  }
}

module.exports = { calculateOfflineEarnings };