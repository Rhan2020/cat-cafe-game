const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// APIres.t('auto.e99990e6')
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
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, '登录尝试过于频繁，请15分钟后再试');

// CORS配置
const corsOptions = process.env.NODE_ENV === 'test' ? { origin: '*'} : {
  origin: function (origin, callback) {
    // res.t('auto.e58581e8')
    const allowedOrigins = [
      'http://localhost:3000',
      'https://admin.catcafe.com',
      'https://game.catcafe.com'
    ];
    
    // res.t('auto.e58581e8')originres.t('auto.e79a84e8')（res.t('auto.e6af94e5')）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('res.t('auto.e4b88de5')CORSres.t('auto.e8afb7e6')'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// res.t('auto.e5ae89e5')
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