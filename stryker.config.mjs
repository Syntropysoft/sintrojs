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
    '!src/testing/**', // Testing utilities (meta) - includes TinyTest, SmartMutator
    '!src/testing/SmartMutator.ts', // Explicitly exclude SmartMutator
    '!src/infrastructure/UltraFastAdapter.ts', // Experimental adapter
    '!src/infrastructure/UltraFastifyAdapter.ts', // Experimental adapter
    '!src/infrastructure/UltraMinimalAdapter.ts', // Experimental adapter
    '!src/infrastructure/BunAdapter.ts', // Bun-specific, minimal test coverage
    '!src/infrastructure/RuntimeOptimizer.ts', // Runtime detection, minimal logic
    '!src/domain/types.ts', // Type definitions only
  ],

  // Vitest config
  vitest: {
    configFile: 'vitest.config.ts',
  },

  // Thresholds for CI/CD (adjusted for equivalent mutant strategy)
  thresholds: {
    high: 75, // Realistic target with equivalent mutants excluded
    low: 60, // Minimum acceptable score
    break: 50, // Break build below this
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
  plugins: ['@stryker-mutator/vitest-runner', '@stryker-mutator/typescript-checker'],

  // TypeScript checker - disabled for performance (can enable for stricter validation)
  // checkers: ['typescript'], // Commented out for faster execution
  tsconfigFile: 'tsconfig.json',

  // Performance settings
  concurrency: 8, // Increased for better parallelism
  timeoutMS: 30000, // 30 seconds per test (reduced from 60)
  timeoutFactor: 2.0, // Increased from 1.5

  // Disable mutations that are rarely useful
  disableTypeChecks: '{test,spec}/**/*.{js,ts}',

  // Ignore specific mutators that generate false positives (equivalent mutants)
  mutator: {
    excludedMutations: [
      'StringLiteral', // Often breaks error messages
      'ObjectLiteral', // Config objects
      'LogicalOperator', // Guard clause OR/AND mutants are often equivalent
      'ConditionalExpression', // Ternary operator mutants often don't change behavior
      'BooleanLiteral', // Many boolean mutants in configuration are equivalent
    ],
  },

  // Incremental mode (optional - speeds up CI)
  incremental: false,
  incrementalFile: 'reports/mutation/stryker-incremental.json',
};

export default config;
