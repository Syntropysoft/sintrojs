/**
 * Simple Test Example
 * 
 * Test your SyntroJS API with TinyTest.
 */

import { TinyTest } from 'syntrojs/testing';

const test = new TinyTest();

// Test your endpoint
test.get('/hello', {
  handler: () => ({ message: 'Hello World!' }),
});

// Run the test
const result = await test.expectSuccess('GET', '/hello', {
  expected: { message: 'Hello World!' }
});

console.log('✅ Test passed:', result);

await test.close();
