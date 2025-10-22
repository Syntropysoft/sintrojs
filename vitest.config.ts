import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'], // Only measure src/ directory
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        'example-app/**',
        'examples/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/index.ts',
      ],
      thresholds: {
        // Production-ready thresholds (v0.1.0+)
        // Current coverage: 90.71% stmts, 91.57% branches, 94.04% functions
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
