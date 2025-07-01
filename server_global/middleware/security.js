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

// res.t('auto.e9809ae7')APIres.t('auto.e99990e6')
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15res.t('auto.e58886e9')
  100, // res.t('auto.e6af8fe4')IPres.t('auto.e69c80e5')100res.t('auto.e4b8aae8')
  'res.t('auto.e8afb7e6')，res.t('auto.e8afb7e7')'
);

// res.t('auto.e799bbe5')APIres.t('auto.e4b8a5e6')
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15res.t('auto.e58886e9')
  5, // res.t('auto.e6af8fe4')IPres.t('auto.e69c80e5')5res.t('auto.e6aca1e7')
  'res.t('auto.e799bbe5')，请15res.t('auto.e58886e9')'
);

// CORSres.t('auto.e9858de7')
const corsOptions = {
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

module.exports = {
  generalLimiter,
  authLimiter,
  corsOptions,
  helmetConfig
};