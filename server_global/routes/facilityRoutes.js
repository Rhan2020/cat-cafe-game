const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { param, validationResult } = require('express-validator');
const { upgradeFacility } = require('../controllers/facilityController');

router.use(protect);

router.post('/:facilityId/upgrade',
  param('facilityId').isString().notEmpty(),
  (req,res,next)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({code:400,message:'Validation error',errors:errors.array()});
    next();
  },
  upgradeFacility);

module.exports = router;