const express = require('express');
const router = express.Router();
const { login } = require('../controllers/userController');

// @route   POST /api/users/login
router.post('/login', login);

module.exports = router;
