const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();

// res.t('auto.e5afbce5')
const errorHandler = require('./middleware/errorHandler');
const { httpLogger } = require('./middleware/logging');
const { generalLimiter, helmetConfig, corsOptions } = require('./middleware/security');
const { i18nMiddleware } = require('./utils/i18n');

const app = express();
const port = process.env.PORT || 8080;

// res.t('auto.e4bfa1e4')（res.t('auto.e794a8e4')IP）
app.set('trust proxy', 1);

// res.t('auto.e5ae89e5')
app.use(helmetConfig);
app.use(require('cors')(corsOptions));

// res.t('auto.e9809ae7')
app.use(generalLimiter);

// res.t('auto.e697a5e5')
app.use(httpLogger);

// res.t('auto.e59fbae7')
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Connection
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
  logger.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => logger.info('MongoDB connected successfully.'))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

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
    environment: process.env.NODE_ENV || 'development'
  });
});

// APIres.t('auto.e8b7afe7')
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

// res.t('auto.e99d99e6')（res.t('auto.e7b4a0e6')）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404res.t('auto.e5a484e7')
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: 'res.t('auto.e68ea5e5')',
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

app.listen(port, () => {
  logger.info(`全球服务器正在端口 ${port} 上运行`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`健康检查: http://localhost:${port}/health`);
});

module.exports = app;
