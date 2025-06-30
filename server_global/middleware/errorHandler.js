const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.stack}`);
  
  // 不同类型的错误处理
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      code: 400,
      message: '输入数据验证失败',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      code: 400,
      message: '无效的ID格式' 
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      code: 400,
      message: '数据已存在' 
    });
  }
  
  // 默认错误处理
  res.status(500).json({ 
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;