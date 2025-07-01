const User = require('../models/User');
const { calculateOfflineEarnings } = require('../utils/offlineEarnings');
const logger = require('../utils/logger');

/**
 * 在每个需要保护的请求之前调用。
 * 若距离 lastActiveAt 超过 5 分钟，则预计算离线收益并存储在 user.offlineEarnings。
 */
module.exports = async function offlineTracker(req, res, next) {
  try {
    if (!req.user || !req.user.id) return next();

    const user = await User.findById(req.user.id);
    if (!user) return next();

    const now = Date.now();
    const diff = now - (user.lastActiveAt ? user.lastActiveAt.getTime() : now);
    if (diff < 5 * 60 * 1000) return next(); // 少于5分钟忽略

    // 如果已有待领取收益且未到领取，则不重复累积
    if (user.offlineEarnings && user.offlineEarnings > 0) {
      return next();
    }

    const earnings = await calculateOfflineEarnings(user);
    if (earnings > 0) {
      user.offlineEarnings = earnings;
    }
    user.lastActiveAt = new Date();
    await user.save();
    next();
  } catch (err) {
    logger.error('offlineTracker error: %s', err.message);
    next();
  }
};