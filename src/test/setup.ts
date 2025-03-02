// Global test setup
import 'jest-extended';

// Add any global test setup code here
// This file runs before each test suite

// Set default timeout for tests
jest.setTimeout(30000);

// Clean up any global mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});