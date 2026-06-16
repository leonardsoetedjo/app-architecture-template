const base = require('./jest.config.js');

module.exports = {
  ...base,
  testRegex: 'test/integration/.*\\.spec\\.ts$',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/integration/setup.ts'],
};
