/**
 * Test script to demonstrate production warning
 *
 * Usage:
 * NODE_ENV=production node scripts/test-production-warning.js
 */

import { SyntroJS } from '../dist/index.js';

console.log('Testing production warning...\n');

const app = new SyntroJS({
  title: 'Test API',
  // docs is undefined (default) - should trigger warning
});

app.get('/hello', {
  handler: () => ({ message: 'Hello' }),
});

const address = await app.listen(3000);

console.log(`\nServer running at ${address}`);
console.log('Press Ctrl+C to stop\n');
