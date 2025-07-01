const { body, param, validationResult } = require('express-validator');

// res.t('auto.e9aa8ce8')
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 400,
      message: 'res.t('auto.e8be93e5')',
      errors: errors.array()
    });
  }
  next();
};

// res.t('auto.e794a8e6')
const validateLogin = [
  body('authProviderId')
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage('res.t('auto.e8aea4e8')IDres.t('auto.e5bf85e9')1-100res.t('auto.e5ad97e7')'),
  body('nickname')
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .matches(/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/)
    .withMessage('res.t('auto.e698b5e7')、res.t('auto.e695b0e5')、res.t('auto.e4b8ade6')、res.t('auto.e4b88be5')'),
  handleValidationErrors
];

// res.t('auto.e794a8e6')IDres.t('auto.e9aa8ce8')
const validateUserId = [
  param('id')
    .isMongoId()
    .withMessage('res.t('auto.e697a0e6')IDres.t('auto.e6a0bce5')'),
  handleValidationErrors
];

// res.t('auto.e58aa8e7')
const validateAnimalCreation = [
  body('ownerId')
    .isMongoId()
    .withMessage('res.t('auto.e697a0e6')IDres.t('auto.e6a0bce5')'),
  body('breedId')
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('res.t('auto.e59381e7')IDres.t('auto.e5bf85e9')1-50res.t('auto.e5ad97e7')'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 30 })
    .trim()
    .escape()
    .withMessage('res.t('auto.e58aa8e7')1-30res.t('auto.e5ad97e7')'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateUserId,
  validateAnimalCreation,
  handleValidationErrors
};