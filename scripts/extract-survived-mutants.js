// Script to extract surviving mutants from Stryker report
const fs = require('node:fs');
const path = require('node:path');

const reportPath = path.join(__dirname, 'reports/mutation/mutation-report.json');

try {
  const reportData = fs.readFileSync(reportPath, 'utf8');
  const report = JSON.parse(reportData);

  console.log('\n📊 SURVIVING MUTANTS BY FILE\n');
  console.log('='.repeat(80));

  // Group by file
  const byFile = {};

  if (report.files) {
    Object.entries(report.files).forEach(([filePath, fileData]) => {
      const source = fileData.source || '';
      const mutants = fileData.mutants || [];

      const survived = mutants.filter((m) => m.status === 'Survived');

      if (survived.length > 0) {
        byFile[filePath] = survived;
      }
    });

    // Sort by count (descending)
    const sortedFiles = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);

    sortedFiles.forEach(([filePath, survived]) => {
      console.log(`\n${filePath} - ${survived.length} survived\n`);

      // Show top 5 mutants
      survived.slice(0, 5).forEach((mutant) => {
        const lines = mutant.location.start.line;
        console.log(`  Line ${lines}: ${mutant.mutatorName}`);
        console.log(`    ${mutant.replacement.trim()}`);
      });

      if (survived.length > 5) {
        console.log(`  ... and ${survived.length - 5} more`);
      }
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log(`\nTotal files with survived mutants: ${sortedFiles.length}`);
    console.log(`Total survived mutants: ${sortedFiles.reduce((sum, f) => sum + f[1].length, 0)}`);
  }
} catch (error) {
  console.error('Error reading report:', error.message);
}
