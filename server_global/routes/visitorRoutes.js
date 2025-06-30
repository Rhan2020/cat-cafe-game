const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPendingVisitor, chooseVisitorOption } = require('../controllers/visitorController');

router.use(protect);

// 获取待处理访客
router.get('/pending', getPendingVisitor);

// 处理访客选择
router.post('/choose', chooseVisitorOption);

module.exports = router;