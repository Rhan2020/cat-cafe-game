const { body, param, validationResult } = require('express-validator');

// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 400,
      message: '输入验证失败',
      errors: errors.array()
    });
  }
  next();
};

// 用户登录验证
const validateLogin = [
  body('authProviderId')
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage('认证提供商ID必须在1-100字符之间'),
  body('nickname')
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .matches(/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/)
    .withMessage('昵称只能包含字母、数字、中文、下划线和连字符'),
  handleValidationErrors
];

// 用户ID验证
const validateUserId = [
  param('id')
    .isMongoId()
    .withMessage('无效的用户ID格式'),
  handleValidationErrors
];

// 动物创建验证
const validateAnimalCreation = [
  body('ownerId')
    .isMongoId()
    .withMessage('无效的用户ID格式'),
  body('breedId')
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('品种ID必须在1-50字符之间'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 30 })
    .trim()
    .escape()
    .withMessage('动物名称必须在1-30字符之间'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateUserId,
  validateAnimalCreation,
  handleValidationErrors
};