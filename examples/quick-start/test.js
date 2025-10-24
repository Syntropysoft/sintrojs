/**
 * Simple Test Example
 * 
 * Test the same 4-line API we created in app.js
 */

import { TinyTest } from 'syntrojs/testing';

const test = new TinyTest();

// Test the exact same API from app.js
test.get('/hello', {
  handler: () => ({ message: 'Hello World!' }),
});

// Run the test
const result = await test.expectSuccess('GET', '/hello', {
  expected: { message: 'Hello World!' }
});

console.log('✅ Test passed:', result);

await test.close();
