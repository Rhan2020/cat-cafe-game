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
const {
  previewOfflineEarnings,
  claimOfflineEarnings
} = require('../controllers/offlineController');

// res.t('auto.e585ace5')
router.get('/configs', getGameConfigs);
router.get('/bubbles/random', getRandomBubble);

// res.t('auto.e99c80e8')
router.use(protect);

// res.t('auto.e68abde5') - res.t('auto.e6b7bbe5')
router.post('/recruit', verifyHmac, rateLimit(60 * 1000, 20), recruitAnimal);

// res.t('auto.e8bdace7') - res.t('auto.e6af8fe6')
router.post('/wheel/spin', verifyHmac, rateLimit(60 * 1000, 10), spinWheel);

// res.t('auto.e5a496e5')
router.post('/delivery/start', verifyHmac, startDelivery);

// res.t('auto.e5908ee9')
router.post('/fishing/start', verifyHmac, rateLimit(60 * 1000, 10), startFishing);
router.post('/fishing/complete', verifyHmac, completeFishing);

// 离线收益
router.get('/offline/preview', previewOfflineEarnings);
router.post('/offline/claim', claimOfflineEarnings);

module.exports = router;