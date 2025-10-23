import { SmartMutator } from './src/testing/SmartMutator';

async function main() {
  console.log('Running SmartMutator in full mode...');
  const report = await SmartMutator.run({ mode: 'full' });
  console.log('Smart Mutator Report (Full Mode):', report);
}

main().catch(console.error);
