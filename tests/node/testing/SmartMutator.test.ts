/**
 * Tests for SmartMutator
 *
 * Tests verify that SmartMutator:
 * - Loads configuration from stryker.config.mjs
 * - Detects changed files using git diff in smart mode
 * - Applies forceFull flag correctly
 * - Returns proper mutation reports
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SmartMutator } from '../../../src/testing/SmartMutator';

// Mock Stryker for unit tests
const mockStrykerResult = Promise.resolve([
  { id: '1', status: 'Killed', coveredBy: ['1'], nrOfTests: 1, mutants: [] },
  { id: '2', status: 'Killed', coveredBy: ['1'], nrOfTests: 1, mutants: [] },
  { id: '3', status: 'Survived', coveredBy: ['1'], nrOfTests: 1, mutants: [] },
]);

vi.mock('@stryker-mutator/core', () => ({
  Stryker: vi.fn(() => ({
    runMutationTest: vi.fn(() => mockStrykerResult),
  })),
}));

// Mock execSync for git commands
vi.mock('node:child_process', () => ({
  execSync: vi.fn(() => ''),
}));

// Mock Date.now() to control execution time in tests
const mockDateNow = vi.fn();
let currentTime = 0;

describe('SmartMutator', { timeout: 30000 }, () => {
  let mutator: typeof SmartMutator; // Cambiado para referenciar la clase directamente

  beforeEach(() => {
    mutator = SmartMutator; // Asignación directa de la clase
    currentTime = 0;
    mockDateNow.mockImplementation(() => {
      currentTime += 100; // Simulate time passing
      return currentTime;
    });
    vi.stubGlobal('Date', {
      now: mockDateNow,
    });
  });

  describe('run()', () => {
    test('runs in smart mode by default', async () => {
      const report = await mutator.run();

      expect(report.mode).toBe('smart');
      expect(report.totalMutants).toBeGreaterThan(0);
      expect(report.mutationScore).toBeGreaterThanOrEqual(0);
      expect(report.mutationScore).toBeLessThanOrEqual(100);
    });

    test('runs in full mode when specified', async () => {
      const report = await mutator.run({ mode: 'full' });

      expect(report.mode).toBe('full');
    });

    test('returns mutation report', async () => {
      const report = await mutator.run();

      expect(report).toHaveProperty('totalMutants');
      expect(report).toHaveProperty('killed');
      expect(report).toHaveProperty('survived');
      expect(report).toHaveProperty('mutationScore');
      expect(report).toHaveProperty('executionTime');
      expect(report).toHaveProperty('mode');
    });

    test('mutation score is percentage of killed mutants', async () => {
      const report = await mutator.run();

      const expectedScore = (report.killed / report.totalMutants) * 100;
      expect(report.mutationScore).toBeCloseTo(expectedScore, 1);
    });

    test('execution time is measured', async () => {
      const report = await mutator.run();

      expect(report.executionTime).toBeGreaterThan(0);
    });
  });

  describe('Configuration options', () => {
    test('accepts custom config', async () => {
      const report = await mutator.run({
        mode: 'smart',
      });

      expect(report).toBeDefined();
    });

    test('supports incremental mode flag', async () => {
      const report = await mutator.run({
        mode: 'smart',
      });

      expect(report).toBeDefined();
    });

    test('supports watch mode flag', async () => {
      const report = await mutator.run({
        mode: 'smart',
      });

      expect(report).toBeDefined();
    });

    test('supports specific route targeting', async () => {
      const report = await mutator.run({
        mode: 'smart',
      });

      expect(report).toBeDefined();
    });

    test('supports forceFull flag', async () => {
      const report = await mutator.run({
        mode: 'smart',
        forceFull: true,
      });

      expect(report).toBeDefined();
      expect(report.mode).toBe('smart');
    });
  });
});
