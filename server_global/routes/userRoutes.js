const express = require('express');
const router = express.Router();
const { protect, rateLimit } = require('../middleware/auth');
const {
  login,
  getProfile,
  updateSettings,
  updateNickname,
  getTransactions,
  deleteAccount
} = require('../controllers/userController');

// 公开路由
router.post('/login', rateLimit(15 * 60 * 1000, 10), login);

// 需要认证的路由
router.use(protect);

router.get('/profile', getProfile);
router.put('/settings', updateSettings);
router.put('/nickname', updateNickname);
router.get('/transactions', getTransactions);
router.delete('/account', deleteAccount);

module.exports = router;
