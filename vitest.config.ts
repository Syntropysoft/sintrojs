import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/universal/**/*.test.ts', 'tests/node/**/*.test.ts'],
    exclude: ['tests/bun/**/*.test.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'examples/',
        'example-app/',
        'benchmarks/',
        'coverage/',
        'reports/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.cjs',
        '**/*.mjs',
        '**/README.md',
        '**/CHANGELOG.md',
        '**/LICENSE',
        'run-smart-mutator.ts',
        'src/testing/SmartMutatorWrapper.ts',
      ],
    },
  },
});
