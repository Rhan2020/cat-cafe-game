const express = require('express');
const router = express.Router();
const { protect, rateLimit } = require('../middleware/auth');
const { createInvite, acceptInvite } = require('../controllers/contractController');

router.use(protect);

// 创建契约邀请（速率限制）
router.post('/create', rateLimit(60 * 60 * 1000, 5), createInvite);

// 接受邀请（无需限制）
router.post('/accept', acceptInvite);

module.exports = router;