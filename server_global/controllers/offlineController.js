const User = require('../models/User');
const { calculateOfflineEarnings } = require('../utils/offlineEarnings');
const logger = require('../utils/logger');

// 计算并返回当前离线收益（不领取）
exports.previewOfflineEarnings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ code: 404, message: 'User not found' });

    const earnings = await calculateOfflineEarnings(user);
    return res.status(200).json({ code: 200, message: 'Offline earnings preview', data: { earnings } });
  } catch (err) {
    logger.error('previewOfflineEarnings error: %s', err.message);
    return res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};

// 领取离线收益
exports.claimOfflineEarnings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ code: 404, message: 'User not found' });

    let earnings = user.offlineEarnings || 0;

    // 若 offlineEarnings 字段为 0，则实时计算
    if (earnings === 0) {
      earnings = await calculateOfflineEarnings(user);
    }

    if (earnings <= 0) {
      // 更新 lastActiveAt
      user.lastActiveAt = new Date();
      await user.save();
      return res.status(400).json({ code: 400, message: 'No offline earnings' });
    }

    const now = new Date();
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      {
        $inc: { gold: earnings, 'statistics.totalEarnings': earnings },
        $set: { offlineEarnings: 0, lastActiveAt: now }
      },
      { new: true }
    );

    logger.info('User %s claimed %d offline gold', updatedUser._id, earnings);

    return res.status(200).json({ code: 200, message: 'Offline earnings claimed', data: { goldEarned: earnings, currentGold: updatedUser.gold } });
  } catch (err) {
    logger.error('claimOfflineEarnings error: %s', err.message);
    return res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};