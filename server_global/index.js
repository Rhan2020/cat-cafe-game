const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Database Connection
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

mongoose.connect(dbURI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Cat Cafe Global Server is running!',
    version: '1.0.0',
    docs: '/api-docs'
  });
});

// API Routes
const userRoutes = require('./routes/userRoutes');
const animalRoutes = require('./routes/animalRoutes');
const gameRoutes = require('./routes/gameRoutes');

app.use('/api/users', userRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/game', gameRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      code: 400,
      message: 'Validation Error',
      errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      code: 400,
      message: 'Duplicate field value entered'
    });
  }
  
  // Default error
  res.status(500).json({
    code: 500,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Global server is listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // For testing purposes
