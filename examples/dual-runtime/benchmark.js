/**
 * SyntroJS Dual Runtime Benchmark
 *
 * Compare performance between Node.js and Bun
 */

import { SyntroJS } from 'syntrojs';

// Create apps for both runtimes
const appNode = new SyntroJS({ runtime: 'node', title: 'SyntroJS-Node' });
const appBun = new SyntroJS({ runtime: 'bun', title: 'SyntroJS-Bun' });

// Same routes for both
const routes = [
  { method: 'GET', path: '/hello', handler: () => ({ message: 'Hello World!' }) },
  { method: 'GET', path: '/benchmark', handler: () => ({ timestamp: Date.now() }) },
  { method: 'POST', path: '/echo', handler: ({ body }) => ({ echo: body }) },
];

// Register routes for both apps
routes.forEach((route) => {
  appNode[route.method.toLowerCase()](route.path, { handler: route.handler });
  appBun[route.method.toLowerCase()](route.path, { handler: route.handler });
});

// Start both servers
async function startBenchmark() {
  console.log('🚀 Starting SyntroJS Dual Runtime Benchmark\n');

  try {
    // Start Node.js server
    const nodeAddress = await appNode.listen(3001);
    console.log(`✅ Node.js server started at ${nodeAddress}`);

    // Start Bun server (if available)
    try {
      const bunAddress = await appBun.listen(3002);
      console.log(`✅ Bun server started at ${bunAddress}`);

      console.log('\n📊 Benchmark URLs:');
      console.log(`Node.js: http://localhost:3001/benchmark`);
      console.log(`Bun:     http://localhost:3002/benchmark`);

      console.log('\n🧪 Test commands:');
      console.log(`curl http://localhost:3001/hello`);
      console.log(`curl http://localhost:3002/hello`);
    } catch (bunError) {
      console.log(`⚠️  Bun server failed: ${bunError.message}`);
      console.log('💡 Make sure Bun is installed: curl -fsSL https://bun.sh/install | bash');
    }
  } catch (error) {
    console.error('❌ Failed to start servers:', error.message);
  }
}

// Run benchmark
startBenchmark();
