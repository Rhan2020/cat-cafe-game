const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const { httpLogger } = require('./middleware/logging');
const { generalLimiter, helmetConfig, corsOptions } = require('./middleware/security');
const { i18nMiddleware } = require('./utils/i18n');

const app = express();
const port = process.env.PORT || 8080;

// 信任代理（用于获取真实IP）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmetConfig);
app.use(require('cors')(corsOptions));

// 通用限流
app.use(generalLimiter);

// 日志中间件
app.use(httpLogger);

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Connection
const { connectDB } = require('./utils/connectDB');

// 仅在非测试环境下自动连接数据库（测试环境将由测试套件自行管理连接）
if (process.env.NODE_ENV !== 'test') {
  connectDB().catch(err => {
    console.error('MongoDB connection error:', err);
    // 生产环境连接失败时终止进程；其余环境抛出错误供外层捕获
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}

// Basic Route
app.get('/', (req, res) => {
  res.send('Global Server is running!');
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
const userRoutes = require('./routes/userRoutes');
const assetRoutes = require('./routes/assetRoutes');
const gameRoutes = require('./routes/gameRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const contractRoutes = require('./routes/contractRoutes');

app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/contract', contractRoutes);

// 静态文件服务（素材文件）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    path: req.originalUrl
  });
});

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 创建logs目录
const fs = require('fs');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

app.use(i18nMiddleware);

app.listen(port, () => {
  console.log(`全球服务器正在端口 ${port} 上运行`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`健康检查: http://localhost:${port}/health`);
});

module.exports = app;
