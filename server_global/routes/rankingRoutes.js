const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getRankings } = require('../controllers/rankingController');

router.use(protect);

router.get('/:type', getRankings);

module.exports = router;