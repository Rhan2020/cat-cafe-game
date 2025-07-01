require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();
const config = require('./utils/config');

// res.t('auto.e5afbce5')
const errorHandler = require('./middleware/errorHandler');
const { httpLogger } = require('./middleware/logging');
const { generalLimiter, helmetConfig, corsOptions } = require('./middleware/security');
const { i18nMiddleware } = require('./utils/i18n');
const promClient = require('prom-client');
const { scheduleRankingReset } = require('./scripts/weeklyRankingReset');

const app = express();
const port = config.port;

// res.t('auto.e4bfa1e4')（res.t('auto.e794a8e4')IP）
app.set('trust proxy', 1);

// 安全中间件（测试环境跳过，避免 CORS/helmet 干扰）
app.use(helmetConfig);
if (process.env.NODE_ENV !== 'test') {
  app.use(require('cors')(corsOptions));
}

// res.t('auto.e9809ae7')
app.use(generalLimiter);

// res.t('auto.e697a5e5')
app.use(httpLogger);

// res.t('auto.e59fbae7')
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Connection
const { connectDB } = require('./utils/connectDB');

// 仅在非测试环境下自动连接数据库（测试环境将由测试套件自行管理连接）
if (config.env !== 'test') {
  connectDB().catch(err => {
    console.error('MongoDB connection error:', err);
    // 生产环境连接失败时终止进程；其余环境抛出错误供外层捕获
    if (config.env === 'production') {
      process.exit(1);
    }
  });
}

// Basic Route
app.get('/', (req, res) => {
  res.send('Global Server is running!');
});

// res.t('auto.e581a5e5')
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env
  });
});

// APIres.t('auto.e8b7afe7')
const userRoutes = require('./routes/userRoutes');
const assetRoutes = require('./routes/assetRoutes');
const gameRoutes = require('./routes/gameRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const contractRoutes = require('./routes/contractRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const animalRoutes = require('./routes/animalRoutes');

app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/animals', animalRoutes);

// 兼容旧测试：将 /login 代理到新路径
app.post('/login', (req, res, next) => {
  req.url = '/api/users/login';
  userRoutes.handle(req, res, next);
});

// res.t('auto.e99d99e6')（res.t('auto.e7b4a0e6')）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404处理（使用通配 middleware，避免 Express 5 对 '*' 路径的 pathToRegexp 错误）
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Resource not found',
    path: req.originalUrl
  });
});

// res.t('auto.e99499e8')（res.t('auto.e5bf85e9')）
app.use(errorHandler);

// res.t('auto.e5889be5')logsres.t('auto.e79baee5')
const fs = require('fs');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

app.use(i18nMiddleware);

// *********************  Swagger API 文档  ************************
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: '猫咪咖啡馆与外卖江湖 API',
      version: '1.0.0'
    }
  },
  apis: ['./routes/*.js', './models/*.js'] // 自动扫描注释
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// *****************************************************************

// 集成 Prometheus metrics
promClient.collectDefaultMetrics();
app.get('/metrics', async (req,res)=>{
  res.set('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});

// 仅在非测试环境启动 cron
if(config.env !== 'test'){
  scheduleRankingReset();
}

if (config.env !== 'test') {
  app.listen(port, () => {
    console.log(`全球服务器正在端口 ${port} 上运行`);
    console.log(`环境: ${config.env}`);
    console.log(`健康检查: http://localhost:${port}/health`);
  });
}

module.exports = app;
