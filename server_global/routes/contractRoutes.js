const express = require('express');
const router = express.Router();
const { protect, rateLimit } = require('../middleware/auth');
const { createInvite, acceptInvite } = require('../controllers/contractController');

router.use(protect);

// res.t('auto.e5889be5')（res.t('auto.e9809fe7')）
router.post('/create', rateLimit(60 * 60 * 1000, 5), createInvite);

// res.t('auto.e68ea5e5')（res.t('auto.e697a0e9')）
router.post('/accept', acceptInvite);

module.exports = router;