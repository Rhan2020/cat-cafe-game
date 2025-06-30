module.exports = {
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid)/)'
  ],
  moduleNameMapper: {
    '^nanoid(.*)$': '<rootDir>/__mocks__/nanoid.js'
  }
};
