const errorHandler = (err, req, res, next) => {
  logger.error(`[ERROR] ${new Date().toISOString()} - ${err.stack}`);
  
  // res.t('auto.e4b88de5')
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      code: 400,
      message: 'res.t('auto.e8be93e5')',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      code: 400,
      message: 'res.t('auto.e697a0e6')IDres.t('auto.e6a0bce5')' 
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      code: 400,
      message: 'res.t('auto.e695b0e6')' 
    });
  }
  
  // res.t('auto.e9bb98e8')
  res.status(500).json({ 
    code: 500,
    message: 'res.t('auto.e69c8de5')',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;