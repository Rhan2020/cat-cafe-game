const User = require('../models/User');
const GameConfig = require('../models/GameConfig');
const logger = require('../utils/logger');

exports.upgradeFacility = async (req, res) => {
  try {
    const { facilityId } = req.params;
    if (!facilityId) return res.status(400).json({ code: 400, message: 'facilityId required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ code: 404, message: 'User not found' });

    const facilityConfigDoc = await GameConfig.getActiveConfig('facility_upgrades');
    if (!facilityConfigDoc) return res.status(500).json({ code: 500, message: 'Facility config missing' });

    const facilityCfg = facilityConfigDoc.data.find(f => f.id === facilityId);
    if (!facilityCfg) return res.status(400).json({ code: 400, message: 'Invalid facilityId' });

    const currLevel = (user.shop.facilities[facilityId] || 0);
    const nextLevelCfg = facilityCfg.levels.find(l => l.level === currLevel + 1);
    if (!nextLevelCfg) return res.status(400).json({ code: 400, message: 'Max level reached' });

    // 判断资源
    if (user.gold < nextLevelCfg.cost) {
      return res.status(400).json({ code: 400, message: 'Not enough gold' });
    }

    // 原子更新
    user.gold -= nextLevelCfg.cost;
    user.shop.facilities[facilityId] = currLevel + 1;
    user.markModified('shop');
    await user.save();

    res.status(200).json({ code: 200, message: 'Facility upgraded', data: { facilityId, level: currLevel + 1, goldLeft: user.gold } });
  } catch (err) {
    logger.error('upgradeFacility error: %s', err.message);
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};