module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Explicitly define the root directory for tests to avoid picking up
  // stray test files from other directories.
  roots: ['<rootDir>/tests'],
  // Point to the global mocks directory
  moduleDirectories: ['node_modules', '<rootDir>/'],
};
