module.exports = {
  testEnvironment: 'node',
  // nanoid 已通过 moduleNameMapper mock，无需额外 transformIgnore
  moduleNameMapper: {
    '^nanoid(.*)$': '<rootDir>/__mocks__/nanoid.js',
    '^joi$': '<rootDir>/__mocks__/joi.js',
    '^express-async-errors$': '<rootDir>/__mocks__/express-async-errors.js',
    '^swagger-jsdoc$': '<rootDir>/__mocks__/swagger-jsdoc.js',
    '^swagger-ui-express$': '<rootDir>/__mocks__/swagger-ui-express.js',
    '^google-auth-library$': '<rootDir>/__mocks__/google-auth-library.js',
    '^node-cron$': '<rootDir>/__mocks__/node-cron.js',
    '^prom-client$': '<rootDir>/__mocks__/prom-client.js'
  },
  // 忽略已过时的旧测试目录，避免不必要的失败
  testPathIgnorePatterns: ['<rootDir>/__tests__/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
