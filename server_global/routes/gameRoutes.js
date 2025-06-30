const express = require('express');
const router = express.Router();
const { protect, rateLimit } = require('../middleware/auth');
const {
  getGameConfigs,
  recruitAnimal,
  spinWheel,
  startDelivery,
  startFishing,
  completeFishing,
  getRandomBubble
} = require('../controllers/gameController');

// 公开路由
router.get('/configs', getGameConfigs);
router.get('/bubbles/random', getRandomBubble);

// 需要认证的路由
router.use(protect);

// 抽卡系统 - 添加速率限制防止刷单
router.post('/recruit', rateLimit(60 * 1000, 20), recruitAnimal);

// 转盘系统 - 每日限制
router.post('/wheel/spin', rateLimit(60 * 1000, 10), spinWheel);

// 外卖系统
router.post('/delivery/start', startDelivery);

// 后院钓鱼系统
router.post('/fishing/start', rateLimit(60 * 1000, 10), startFishing);
router.post('/fishing/complete', completeFishing);

module.exports = router;