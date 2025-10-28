import { SmartMutator } from '../src/testing/SmartMutator';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const mode = args.includes('--mode') 
    ? args[args.indexOf('--mode') + 1] as 'smart' | 'full'
    : 'smart';
  
  const forceFull = args.includes('--forceFull');

  console.log(`🧬 Running SmartMutator in ${mode} mode${forceFull ? ' (forceFull)' : ''}...`);
  
  const report = await SmartMutator.run({ mode, forceFull });
  
  console.log('\n📊 Mutation Report:');
  console.log(`  Mode: ${report.mode}`);
  console.log(`  Total Mutants: ${report.totalMutants}`);
  console.log(`  Killed: ${report.killed}`);
  console.log(`  Survived: ${report.survived}`);
  console.log(`  Mutation Score: ${report.mutationScore.toFixed(2)}%`);
  console.log(`  Execution Time: ${report.executionTime}ms`);
}

main().catch(console.error);
