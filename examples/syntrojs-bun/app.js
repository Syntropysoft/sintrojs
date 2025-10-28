/**
 * SyntroJS-Bun Example
 *
 * Ultra-fast API using Bun runtime
 * Target: 6x faster than Fastify
 */

import { SyntroJSBun } from 'syntrojs/bun';

// Create ultra-fast API with Bun
const app = new SyntroJSBun({ title: 'SyntroJS-Bun API' });

app.get('/hello', {
  handler: () => ({ message: 'Hello from SyntroJS-Bun!' }),
});

app.get('/benchmark', {
  handler: () => ({
    message: 'SyntroJS-Bun Performance Test',
    runtime: 'Bun (JavaScriptCore)',
    target: '6x faster than Fastify',
    timestamp: new Date().toISOString(),
  }),
});

app.post('/echo', {
  handler: ({ body }) => ({
    echo: body,
    processed: 'by SyntroJS-Bun',
    timestamp: new Date().toISOString(),
  }),
});

// Start server
app.listen(8080).then((address) => {
  console.log('🎯 Ready for benchmarking!');
  console.log(`Test with: curl ${address}/benchmark`);
});
