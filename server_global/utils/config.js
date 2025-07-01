const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();

// 定义环境变量模式
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
  PORT: Joi.number().integer().min(0).default(8080),
  MONGODB_URI: Joi.string().uri().default('mongodb://127.0.0.1:27017/catcafe'),
  REDIS_URL: Joi.string().uri().default('redis://127.0.0.1:6379'),
  JWT_SECRET: Joi.string().default('test-secret'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info')
}).unknown();

const { value: env, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  // 直接抛出错误，阻止应用启动
  // 在测试环境下仍然抛出，以确保测试透露问题
  throw new Error(`环境变量验证失败: ${error.message}`);
}

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,
  mongoUri: env.MONGODB_URI,
  redisUrl: env.REDIS_URL,
  jwtSecret: env.JWT_SECRET,
  logLevel: env.LOG_LEVEL
};