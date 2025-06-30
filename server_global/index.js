const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const { httpLogger } = require('./middleware/logging');
const { generalLimiter, helmetConfig, corsOptions } = require('./middleware/security');

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
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

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

app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/game', gameRoutes);

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

app.listen(port, () => {
  console.log(`全球服务器正在端口 ${port} 上运行`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`健康检查: http://localhost:${port}/health`);
});

module.exports = app;
