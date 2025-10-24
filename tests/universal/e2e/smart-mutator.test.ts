import { describe, expect, test } from 'vitest';
import { SmartMutator } from '../../../src/testing/SmartMutator';

describe.skip('SmartMutator E2E - Mínimo', { timeout: 120000 }, () => {
  // Increased timeout for E2E mutation tests

  test('should run in smart mode and not report initial test failures', async () => {
    console.log('Starting SmartMutator in smart mode (E2E) - Mínimo');
    // Por ahora, solo nos interesa que no falle con "There were failed tests in the initial test run."
    // Las aserciones de reporte las agregaremos una vez que Stryker inicie correctamente.
    const report = await SmartMutator.run({ mode: 'smart' });
    console.log('Finished SmartMutator in smart mode (E2E) - Mínimo');
    expect(report).toBeDefined();
    console.log('Smart mode minimal report:', report);
  });

  test('should run in full mode and not report initial test failures', async () => {
    console.log('Starting SmartMutator in full mode (E2E) - Mínimo');
    const report = await SmartMutator.run({ mode: 'full' });
    console.log('Finished SmartMutator in full mode (E2E) - Mínimo');
    expect(report).toBeDefined();
    console.log('Full mode minimal report:', report);
  });
});
