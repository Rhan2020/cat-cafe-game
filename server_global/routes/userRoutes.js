const express = require('express');
const router = express.Router();
const { login, getProfile, updateSettings, updateNickname, getTransactions } = require('../controllers/userController');
const { validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');
const { protect } = require('../middleware/auth');

// @route   POST /api/users/login
// @desc    res.t('auto.e794a8e6')
// @access  Public
router.post('/login', authLimiter, validateLogin, login);

// 第三方 OAuth 登录
const { oauthLogin } = require('../controllers/oauthController');
router.post('/oauth', authLimiter, oauthLogin);

// 需要认证
router.use(protect);

router.get('/profile', getProfile);
router.put('/settings', updateSettings);
router.put('/nickname', updateNickname);
router.get('/transactions', getTransactions);

module.exports = router;
