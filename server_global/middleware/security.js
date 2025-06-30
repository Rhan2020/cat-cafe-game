const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// API限流配置
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      code: 429,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// 登录API严格限流
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15分钟
  5, // 每个IP最多5次登录尝试
  '登录尝试过于频繁，请15分钟后再试'
);

// CORS配置
const corsOptions = process.env.NODE_ENV === 'test' ? { origin: '*'} : {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:3000',
      'https://admin.catcafe.com',
      'https://game.catcafe.com'
    ];
    
    // 允许没有origin的请求（比如移动应用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('不允许的CORS请求源'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// 安全头配置
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

const generalLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : createRateLimiter(15 * 60 * 1000, 100, '请求过于频繁，请稍后再试');

module.exports = {
  generalLimiter,
  authLimiter,
  corsOptions,
  helmetConfig
};