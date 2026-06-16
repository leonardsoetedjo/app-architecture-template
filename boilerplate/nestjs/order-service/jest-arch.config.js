const base = require('./jest.config.js');

module.exports = {
  ...base,
  testRegex: 'test/archunit/.*\\.spec\\.ts$',
  testTimeout: 30000,
};
