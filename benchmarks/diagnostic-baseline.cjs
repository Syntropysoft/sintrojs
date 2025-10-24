#!/usr/bin/env node

/**
 * SyntroJS Performance Benchmark DIAGNOSTIC
 *
 * Benchmark súper simple para diagnosticar problemas
 */

const fastify = require('fastify');
const http = require('http');
const { performance } = require('perf_hooks');

function createFastify() {
  const app = fastify({
    logger: false,
  });

  app.get('/hello', async (request, reply) => {
    return { message: 'Hello World!' };
  });

  return app;
}

async function testSingleRequest(port) {
  return new Promise((resolve) => {
    const start = performance.now();
    const req = http.request(
      {
        hostname: 'localhost',
        port: port,
        path: '/hello',
        method: 'GET',
      },
      (res) => {
        res.resume();
        res.on('end', () => {
          const end = performance.now();
          resolve({
            latency: end - start,
            success: res.statusCode >= 200 && res.statusCode < 300,
          });
        });
      },
    );

    req.on('error', (err) => {
      resolve({ latency: 0, success: false, error: err.message });
    });

    req.end();
  });
}

async function testConcurrentRequests(port, count) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(testSingleRequest(port));
  }
  return Promise.all(promises);
}

async function main() {
  console.log('🚀 SyntroJS Performance Benchmark DIAGNOSTIC');
  console.log('=============================================');
  console.log('🎯 Goal: Diagnosticar problemas de performance');

  try {
    // Test Fastify
    console.log('\n🟢 Testing Fastify...');
    const fastifyApp = createFastify();
    await fastifyApp.listen(3000);
    console.log('✅ Fastify server started on port 3000');

    // Test single request
    console.log('\n🔍 Testing single request...');
    const singleResult = await testSingleRequest(3000);
    console.log(
      `   Single request: ${singleResult.latency.toFixed(1)}ms (success: ${singleResult.success})`,
    );

    if (!singleResult.success) {
      console.log(`   Error: ${singleResult.error}`);
      return;
    }

    // Test 10 concurrent requests
    console.log('\n🔍 Testing 10 concurrent requests...');
    const start10 = performance.now();
    const results10 = await testConcurrentRequests(3000, 10);
    const end10 = performance.now();
    const successful10 = results10.filter((r) => r.success);
    const rps10 = Math.round((successful10.length / (end10 - start10)) * 1000);
    console.log(`   10 concurrent: ${rps10} req/sec (${successful10.length}/10)`);

    // Test 100 concurrent requests
    console.log('\n🔍 Testing 100 concurrent requests...');
    const start100 = performance.now();
    const results100 = await testConcurrentRequests(3000, 100);
    const end100 = performance.now();
    const successful100 = results100.filter((r) => r.success);
    const rps100 = Math.round((successful100.length / (end100 - start100)) * 1000);
    console.log(`   100 concurrent: ${rps100} req/sec (${successful100.length}/100)`);

    // Test 1000 concurrent requests
    console.log('\n🔍 Testing 1000 concurrent requests...');
    const start1000 = performance.now();
    const results1000 = await testConcurrentRequests(3000, 1000);
    const end1000 = performance.now();
    const successful1000 = results1000.filter((r) => r.success);
    const rps1000 = Math.round((successful1000.length / (end1000 - start1000)) * 1000);
    console.log(`   1000 concurrent: ${rps1000} req/sec (${successful1000.length}/1000)`);

    await fastifyApp.close();

    // Results
    console.log('\n📊 DIAGNOSTIC RESULTS');
    console.log('=====================');
    console.log(`Single request:    ${singleResult.latency.toFixed(1)}ms`);
    console.log(`10 concurrent:     ${rps10} req/sec`);
    console.log(`100 concurrent:     ${rps100} req/sec`);
    console.log(`1000 concurrent:   ${rps1000} req/sec`);

    // Analysis
    console.log('\n🔍 ANALYSIS');
    console.log('===========');

    if (rps1000 > 10000) {
      console.log('🎉 EXCELLENT: Performance is very good');
    } else if (rps1000 > 5000) {
      console.log('✅ GOOD: Performance is acceptable');
    } else if (rps1000 > 1000) {
      console.log('⚠️  MODERATE: Performance needs improvement');
    } else {
      console.log('❌ POOR: Performance is too low');
    }

    // Next steps
    console.log('\n💡 NEXT STEPS');
    console.log('=============');

    if (rps1000 < 1000) {
      console.log('🚨 CRITICAL: Performance too low');
      console.log('   • Check if Fastify is working correctly');
      console.log('   • Verify no unnecessary overhead');
      console.log('   • Profile the request pipeline');
    } else if (rps1000 < 5000) {
      console.log('⚠️  HIGH PRIORITY: Need significant optimization');
      console.log('   • Optimize request pipeline');
      console.log('   • Minimize object allocations');
      console.log('   • Reduce function call overhead');
    } else {
      console.log('✅ GOOD: Performance is acceptable');
      console.log('   • Continue with feature development');
      console.log('   • Consider micro-optimizations');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n✅ Diagnostic test completed');
}

main().catch(console.error);
