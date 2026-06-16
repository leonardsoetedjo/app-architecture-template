const base = require('./jest.config.js');

module.exports = {
  ...base,
  testRegex: 'test/unit/.*\\.spec\\.ts$',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/src/main.ts',
    '/src/app.module.ts',
  ],
};
