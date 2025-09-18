// Test setup file for Jest
// This file runs before each test file

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
    ...console,
    // Uncomment to ignore specific console methods during tests
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Global test utilities
global.testUtils = {
    // Add any global test utilities here
    createTestUser: (overrides = {}) => ({
        name: 'Test User',
        email: 'test@example.com',
        role: 'intern',
        ...overrides
    })
};
