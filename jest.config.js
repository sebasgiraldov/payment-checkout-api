module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.ts',
    '**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
    '!src/**/*.interface.ts',
    '!src/**/index.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/server.ts',
    '/src/main.ts',
    '/src/index.ts',
    '/src/config/',
    '/src/interfaces/routes/',
    '/src/infrastructure/database/',
    '/src/interfaces/controllers',
    '/src/infrastructure/repositories',
    '/src/container.ts',
    '/src/app.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 68,
      lines: 68,
      statements: 68,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: false,
  forceExit: true,
};
