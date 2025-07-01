const express = require('express');
const router = express.Router();
const { login } = require('../controllers/userController');
const { validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

// @route   POST /api/users/login
// @desc    res.t('auto.e794a8e6')
// @access  Public
router.post('/login', authLimiter, validateLogin, login);

module.exports = router;
