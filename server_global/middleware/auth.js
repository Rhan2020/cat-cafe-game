const jwt = require('jsonwebtoken');
const { logger } = require('./logging');
const expressRateLimit = require('express-rate-limit');

// JWT tokenres.t('auto.e9aa8ce8')
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      message: 'res.t('auto.e8aebfe9')：res.t('auto.e7bcbae5')' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
    if (err) {
      logger.warn('res.t('auto.e697a0e6')JWTres.t('auto.e4bba4e7')', { 
        error: err.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ 
        message: 'res.t('auto.e8aebfe9')：res.t('auto.e697a0e6')' 
      });
    }

    // res.t('auto.e5b086e7')
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role || 'user'
    };

    next();
  });
};

// res.t('auto.e8a792e8')
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'res.t('auto.e8aebfe9')：res.t('auto.e794a8e6')' 
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn('res.t('auto.e794a8e6')', {
        userId: req.user.id,
        userRole: userRole,
        requiredRoles: allowedRoles,
        ip: req.ip
      });
      
      return res.status(403).json({ 
        message: 'res.t('auto.e8aebfe9')：res.t('auto.e69d83e9')' 
      });
    }

    next();
  };
};

// res.t('auto.e7aea1e7')
const requireAdmin = requireRole(['admin', 'super_admin']);

// res.t('auto.e7bc96e8')（res.t('auto.e7aea1e7')）
const requireEditor = requireRole(['admin', 'super_admin', 'editor']);

// res.t('auto.e5bfabe9')（res.t('auto.e794a8e4')）
const rateLimit = (windowMs, max) => {
  return expressRateLimit({
    windowMs,
    max,
    message: {
      code: 429,
      message: 'res.t('auto.e8afb7e6')，res.t('auto.e8afb7e7')'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  // res.t('auto.e585bce5')
  protect: authenticateToken,
  authenticateToken,
  requireRole,
  requireAdmin,
  requireEditor,
  rateLimit
};