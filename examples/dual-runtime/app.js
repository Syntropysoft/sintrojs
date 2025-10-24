/**
 * SyntroJS Dual Runtime Example
 *
 * Same code, different runtimes!
 * Run with: node app.js (Node.js)
 * Run with: bun app.js (Bun)
 */

import { SyntroJS } from 'syntrojs';
import { z } from 'zod';

// Same code for both runtimes!
const app = new SyntroJS({ title: 'SyntroJS Dual Runtime API' });

app.get('/hello', {
  handler: () => ({
    message: 'Hello from SyntroJS!',
    runtime: 'Auto-detected',
  }),
});

app.get('/runtime', {
  handler: () => ({
    message: 'Runtime information',
    runtime: typeof Bun !== 'undefined' ? 'Bun (JavaScriptCore)' : 'Node.js (V8)',
    performance: typeof Bun !== 'undefined' ? '6x faster than Fastify' : '89.3% of Fastify',
    timestamp: new Date().toISOString(),
  }),
});

app.post('/echo', {
  body: z.object({
    message: z.string(),
    data: z.any().optional(),
  }),
  handler: ({ body }) => ({
    echo: body,
    processed: 'by SyntroJS',
    runtime: typeof Bun !== 'undefined' ? 'Bun' : 'Node.js',
    timestamp: new Date().toISOString(),
  }),
});

// Start server - auto-detects runtime!
app.listen(8082).then((address) => {
  console.log('🎯 Ready for benchmarking!');
  console.log(`Test with: curl ${address}/runtime`);
  console.log(
    `Echo test: curl -X POST ${address}/echo -H "Content-Type: application/json" -d '{"message":"Hello"}'`,
  );
});
