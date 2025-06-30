const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const { getPendingVisitor, chooseVisitorOption } = require('../controllers/visitorController');

router.use(protect);

// 获取待处理访客
router.get('/pending', getPendingVisitor);

// 处理访客选择
router.post('/choose',
  body('eventId').isMongoId().withMessage('Invalid eventId'),
  body('choiceId').isString().notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 400, message: 'Validation error', errors: errors.array() });
    }
    next();
  },
  chooseVisitorOption);

module.exports = router;