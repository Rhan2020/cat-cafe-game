const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const expressRateLimit = require('express-rate-limit');

// JWT tokenres.t('auto.e9aa8ce8')
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      message: 'Access denied: missing authentication token' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
    if (err) {
      logger.warn('Invalid JWT token', { 
        error: err.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ 
        message: 'Access denied: invalid authentication token' 
      });
    }

    // res.t('auto.e5b086e7')
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role || 'user'
    };

    // 离线收益跟踪
    const offlineTracker = require('./offlineTracker');
    offlineTracker(req, res, next);
  });
};

// res.t('auto.e8a792e8')
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Access denied: user unauthenticated' 
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn('User permission insufficient', {
        userId: req.user.id,
        userRole: userRole,
        requiredRoles: allowedRoles,
        ip: req.ip
      });
      
      return res.status(403).json({ 
        message: 'Access denied: insufficient permissions' 
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
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

function generateToken(userId, role = 'user') {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
}

module.exports = {
  protect: authenticateToken,
  authenticateToken,
  requireRole,
  requireAdmin,
  requireEditor,
  rateLimit,
  generateToken
};