const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getRankings } = require('../controllers/rankingController');
const { param, query, validationResult } = require('express-validator');

router.use(protect);

router.get('/:type',
  param('type').isIn(['gold', 'power', 'fish']).withMessage('Invalid ranking type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 400, message: 'Validation error', errors: errors.array() });
    }
    next();
  },
  getRankings);

module.exports = router;