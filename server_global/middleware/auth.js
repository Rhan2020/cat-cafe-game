const jwt = require('jsonwebtoken');
const { logger } = require('./logging');

// JWT token验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      message: '访问被拒绝：缺少身份验证令牌' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
    if (err) {
      logger.warn('无效的JWT令牌', { 
        error: err.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ 
        message: '访问被拒绝：无效的身份验证令牌' 
      });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role || 'user'
    };

    next();
  });
};

// 角色权限验证中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: '访问被拒绝：用户未认证' 
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn('用户权限不足', {
        userId: req.user.id,
        userRole: userRole,
        requiredRoles: allowedRoles,
        ip: req.ip
      });
      
      return res.status(403).json({ 
        message: '访问被拒绝：权限不足' 
      });
    }

    next();
  };
};

// 管理员权限验证
const requireAdmin = requireRole(['admin', 'super_admin']);

// 编辑权限验证（管理员或编辑者）
const requireEditor = requireRole(['admin', 'super_admin', 'editor']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireEditor
};