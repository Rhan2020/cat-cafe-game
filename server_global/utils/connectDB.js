const mongoose = require('mongoose');
const { mongoUri } = require('./config');

/**
 * 连接 MongoDB。
 * 该方法抛出错误而不直接结束进程，以便在测试环境中可由调用方捕获。
 */
async function connectDB() {
  const dbURI = mongoUri;
  if (!dbURI) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  await mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('MongoDB connected successfully.');
}

module.exports = { connectDB };