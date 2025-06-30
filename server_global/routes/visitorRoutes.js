const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPendingVisitor, chooseVisitorOption } = require('../controllers/visitorController');

router.use(protect);

// res.t('auto.e88eb7e5')
router.get('/pending', getPendingVisitor);

// res.t('auto.e5a484e7')
router.post('/choose', chooseVisitorOption);

module.exports = router;