const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`[ERROR] ${new Date().toISOString()} - ${err.stack}`);
  
  // res.t('auto.e4b88de5')
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      code: 400,
      message: 'Validation error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      code: 400,
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      code: 400,
      message: 'Duplicate key error'
    });
  }
  
  // res.t('auto.e9bb98e8')
  res.status(500).json({ 
    code: 500,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;