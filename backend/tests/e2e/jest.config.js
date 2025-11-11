/**
 * Configuração Jest para testes E2E
 */
const path = require('path');

module.exports = {
    rootDir: path.resolve(__dirname, '../..'),
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/e2e/**/*.test.js', '<rootDir>/tests/e2e/test_*.js'],
    testTimeout: 120000,
    verbose: true,
    collectCoverage: false,
    setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js'],
    globalSetup: '<rootDir>/tests/e2e/globalSetup.js',
    globalTeardown: '<rootDir>/tests/e2e/globalTeardown.js'
};
