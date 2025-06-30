module.exports = {
  testEnvironment: 'node',
  // nanoid 已通过 moduleNameMapper mock，无需额外 transformIgnore
  moduleNameMapper: {
    '^nanoid(.*)$': '<rootDir>/__mocks__/nanoid.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
