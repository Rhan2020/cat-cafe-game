const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 认证中间件
const protect = async (req, res, next) => {
  let token;

  // 检查请求头中的 token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 确保 token 存在
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'No token provided, authorization denied'
    });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // 获取用户信息
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: 'User not found, token invalid'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        code: 401,
        message: 'Account is deactivated'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        code: 403,
        message: 'Account is banned',
        reason: user.banReason
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'Token expired'
      });
    }
    
    return res.status(500).json({
      code: 500,
      message: 'Authentication error'
    });
  }
};

// 生成 JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// 管理员权限检查中间件
const adminOnly = async (req, res, next) => {
  try {
    // 检查用户是否有管理员权限
    // 这里可以根据实际需求实现管理员验证逻辑
    if (!req.user.isAdmin) {
      return res.status(403).json({
        code: 403,
        message: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      code: 500,
      message: 'Authorization error'
    });
  }
};

// 速率限制中间件
const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 清理过期的请求记录
    if (requests.has(ip)) {
      const userRequests = requests.get(ip).filter(time => time > windowStart);
      requests.set(ip, userRequests);
    }
    
    const userRequests = requests.get(ip) || [];
    
    if (userRequests.length >= max) {
      return res.status(429).json({
        code: 429,
        message: 'Too many requests, please try again later'
      });
    }
    
    userRequests.push(now);
    requests.set(ip, userRequests);
    
    next();
  };
};

module.exports = {
  protect,
  generateToken,
  adminOnly,
  rateLimit
};