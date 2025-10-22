/**
 * Stryker Configuration for TinyApi
 * 
 * SmartMutator uses this configuration optimized for TinyApi
 * Can also be run in vanilla mode for validation
 */

/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  
  // Mutate only source code (exclude tests, examples, etc.)
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts', // Barrel export, no logic
    '!src/**/index.ts', // Barrel exports
    '!src/testing/**', // Testing utilities (meta)
  ],

  // Vitest config
  vitest: {
    configFile: 'vitest.config.ts',
  },
  
  // Thresholds for CI/CD
  thresholds: {
    high: 90,
    low: 85,
    break: 80,
  },

  // Reporters
  reporters: ['html', 'clear-text', 'progress', 'json'],
  
  // HTML report output
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },

  // JSON report for CI/CD
  jsonReporter: {
    fileName: 'reports/mutation/mutation-report.json',
  },

  // Plugins
  plugins: [
    '@stryker-mutator/vitest-runner',
    '@stryker-mutator/typescript-checker',
  ],

  // TypeScript checker
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',

  // Performance settings
  concurrency: 4, // Adjust based on CPU cores
  timeoutMS: 60000, // 60 seconds per test
  timeoutFactor: 1.5,

  // Disable mutations that are rarely useful
  disableTypeChecks: '{test,spec}/**/*.{js,ts}',

  // Ignore specific mutators that generate false positives
  mutator: {
    excludedMutations: [
      'StringLiteral', // Often breaks error messages
      'ObjectLiteral', // Config objects
    ],
  },

  // Incremental mode (optional - speeds up CI)
  incremental: false,
  incrementalFile: 'reports/mutation/stryker-incremental.json',
};

export default config;

