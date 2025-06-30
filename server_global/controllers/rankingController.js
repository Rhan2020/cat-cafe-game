const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * 获取排行榜
 * @route GET /api/rankings/:type
 * 支持 type=gold / power / fish
 */
exports.getRankings = async (req, res) => {
  try {
    const { type } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    let sortField;
    switch (type) {
      case 'gold':
        sortField = 'gold';
        break;
      case 'power':
        sortField = 'statistics.totalPower'; // 需要定时快照，目前仅示例
        break;
      case 'fish':
        sortField = 'fishing.totalCatches';
        break;
      default:
        return res.status(400).json({ code: 400, message: 'Invalid ranking type' });
    }

    const projection = { nickname: 1, avatarUrl: 1, gold: 1, 'fishing.totalCatches': 1 };
    const users = await User.find({}).sort({ [sortField]: -1 }).limit(limit).select(projection).lean();

    res.status(200).json({ code: 200, message: 'Rankings fetched', data: users });
  } catch (err) {
    logger.error('Error fetching rankings: %s', err.message);
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};