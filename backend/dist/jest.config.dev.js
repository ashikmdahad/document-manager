"use strict";

module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/src/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.js']
};
//# sourceMappingURL=jest.config.dev.js.map
