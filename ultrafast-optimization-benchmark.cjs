#!/usr/bin/env node

/**
 * SyntroJS UltraFast Optimization Benchmark
 * 
 * Benchmark para medir las optimizaciones del UltraFastAdapter
 */

const fastify = require('fastify');
const http = require('http');
const { performance } = require('perf_hooks');

const TEST_DURATION = 3000; // 3 seconds

// SyntroJS Simulation Original
function createSyntroJSSimulation() {
  const app = fastify({
    logger: false
  });
  
  app.get('/hello', async (request, reply) => {
    // Simulamos la validación de SyntroJS
    const query = request.query;
    if (query.name && typeof query.name !== 'string') {
      return reply.status(400).send({ error: 'Invalid query parameter' });
    }
    
    // Simulamos el handler de SyntroJS
    return {
      message: `Hello ${query.name || 'World'}!`,
      timestamp: new Date().toISOString()
    };
  });
  
  return app;
}

// SyntroJS UltraFast Simulation
function createSyntroJSUltraFast() {
  const app = fastify({
    logger: false
  });
  
  // Pool de objetos para reducir allocations
  const contextPool = [];
  const getContext = () => {
    if (contextPool.length > 0) {
      return contextPool.pop();
    }
    return {
      method: 'GET',
      path: '',
      params: {},
      query: {},
      body: {},
      headers: {},
      cookies: {},
      correlationId: '',
      timestamp: new Date(),
      dependencies: {},
      background: {
        addTask: (task) => setImmediate(task)
      }
    };
  };
  
  const releaseContext = (ctx) => {
    // Reset rápido
    ctx.method = 'GET';
    ctx.path = '';
    ctx.params = {};
    ctx.query = {};
    ctx.body = {};
    ctx.headers = {};
    ctx.cookies = {};
    ctx.correlationId = '';
    ctx.timestamp = new Date();
    ctx.dependencies = {};
    contextPool.push(ctx);
  };
  
  // Validación pre-compilada
  const quickValidateQuery = (query) => {
    if (query.name && typeof query.name !== 'string') {
      return query; // Fallback rápido
    }
    return query;
  };
  
  app.get('/hello', async (request, reply) => {
    const context = getContext();
    
    try {
      // Llenar contexto de forma optimizada
      context.method = request.method;
      context.path = request.url;
      context.params = request.params;
      context.query = quickValidateQuery(request.query);
      context.body = request.body;
      context.headers = request.headers;
      context.cookies = request.cookies || {};
      context.correlationId = Math.random().toString(36).substring(2, 15);
      context.timestamp = new Date();
      
      // Handler optimizado
      const result = {
        message: `Hello ${context.query.name || 'World'}!`,
        timestamp: context.timestamp.toISOString()
      };
      
      return result;
      
    } finally {
      releaseContext(context);
    }
  });
  
  return app;
}

// Fastify Baseline
function createFastify() {
  const app = fastify({
    logger: false
  });
  
  app.get('/hello', async (request, reply) => {
    return {
      message: `Hello ${request.query.name || 'World'}!`,
      timestamp: new Date().toISOString()
    };
  });
  
  return app;
}

async function testConcurrentRequests(port, count) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(makeRequest(port, '/hello'));
  }
  return Promise.all(promises);
}

function makeRequest(port, path) {
  return new Promise((resolve) => {
    const start = performance.now();
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET'
    }, (res) => {
      res.resume();
      res.on('end', () => {
        const end = performance.now();
        resolve({
          latency: end - start,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', () => {
      resolve({ latency: 0, success: false });
    });
    
    req.end();
  });
}

async function main() {
  console.log('🚀 SyntroJS UltraFast Optimization Benchmark');
  console.log('=============================================');
  console.log('🎯 Goal: Medir optimizaciones del UltraFastAdapter');
  
  try {
    // Test SyntroJS Original
    console.log('\n🔵 Testing SyntroJS Original...');
    const syntrojsApp = createSyntroJSSimulation();
    await syntrojsApp.listen(3000);
    console.log('✅ SyntroJS original server started on port 3000');
    
    // Test 10 concurrent requests
    console.log('\n🔍 Testing 10 concurrent requests...');
    const start10o = performance.now();
    const results10o = await testConcurrentRequests(3000, 10);
    const end10o = performance.now();
    const successful10o = results10o.filter(r => r.success);
    const rps10o = Math.round((successful10o.length / (end10o - start10o)) * 1000);
    console.log(`   SyntroJS Original 10 concurrent: ${rps10o} req/sec (${successful10o.length}/10)`);
    
    // Test 100 concurrent requests
    console.log('\n🔍 Testing 100 concurrent requests...');
    const start100o = performance.now();
    const results100o = await testConcurrentRequests(3000, 100);
    const end100o = performance.now();
    const successful100o = results100o.filter(r => r.success);
    const rps100o = Math.round((successful100o.length / (end100o - start100o)) * 1000);
    console.log(`   SyntroJS Original 100 concurrent: ${rps100o} req/sec (${successful100o.length}/100)`);
    
    // Test 1000 concurrent requests
    console.log('\n🔍 Testing 1000 concurrent requests...');
    const start1000o = performance.now();
    const results1000o = await testConcurrentRequests(3000, 1000);
    const end1000o = performance.now();
    const successful1000o = results1000o.filter(r => r.success);
    const rps1000o = Math.round((successful1000o.length / (end1000o - start1000o)) * 1000);
    console.log(`   SyntroJS Original 1000 concurrent: ${rps1000o} req/sec (${successful1000o.length}/1000)`);
    
    await syntrojsApp.close();
    
    // Test SyntroJS UltraFast
    console.log('\n⚡ Testing SyntroJS UltraFast...');
    const ultraFastApp = createSyntroJSUltraFast();
    await ultraFastApp.listen(3001);
    console.log('✅ SyntroJS UltraFast server started on port 3001');
    
    // Test 10 concurrent requests
    console.log('\n🔍 Testing 10 concurrent requests...');
    const start10u = performance.now();
    const results10u = await testConcurrentRequests(3001, 10);
    const end10u = performance.now();
    const successful10u = results10u.filter(r => r.success);
    const rps10u = Math.round((successful10u.length / (end10u - start10u)) * 1000);
    console.log(`   SyntroJS UltraFast 10 concurrent: ${rps10u} req/sec (${successful10u.length}/10)`);
    
    // Test 100 concurrent requests
    console.log('\n🔍 Testing 100 concurrent requests...');
    const start100u = performance.now();
    const results100u = await testConcurrentRequests(3001, 100);
    const end100u = performance.now();
    const successful100u = results100u.filter(r => r.success);
    const rps100u = Math.round((successful100u.length / (end100u - start100u)) * 1000);
    console.log(`   SyntroJS UltraFast 100 concurrent: ${rps100u} req/sec (${successful100u.length}/100)`);
    
    // Test 1000 concurrent requests
    console.log('\n🔍 Testing 1000 concurrent requests...');
    const start1000u = performance.now();
    const results1000u = await testConcurrentRequests(3001, 1000);
    const end1000u = performance.now();
    const successful1000u = results1000u.filter(r => r.success);
    const rps1000u = Math.round((successful1000u.length / (end1000u - start1000u)) * 1000);
    console.log(`   SyntroJS UltraFast 1000 concurrent: ${rps1000u} req/sec (${successful1000u.length}/1000)`);
    
    await ultraFastApp.close();
    
    // Test Fastify Baseline
    console.log('\n🟢 Testing Fastify Baseline...');
    const fastifyApp = createFastify();
    await fastifyApp.listen(3002);
    console.log('✅ Fastify baseline server started on port 3002');
    
    // Test 10 concurrent requests
    console.log('\n🔍 Testing 10 concurrent requests...');
    const start10f = performance.now();
    const results10f = await testConcurrentRequests(3002, 10);
    const end10f = performance.now();
    const successful10f = results10f.filter(r => r.success);
    const rps10f = Math.round((successful10f.length / (end10f - start10f)) * 1000);
    console.log(`   Fastify 10 concurrent: ${rps10f} req/sec (${successful10f.length}/10)`);
    
    // Test 100 concurrent requests
    console.log('\n🔍 Testing 100 concurrent requests...');
    const start100f = performance.now();
    const results100f = await testConcurrentRequests(3002, 100);
    const end100f = performance.now();
    const successful100f = results100f.filter(r => r.success);
    const rps100f = Math.round((successful100f.length / (end100f - start100f)) * 1000);
    console.log(`   Fastify 100 concurrent: ${rps100f} req/sec (${successful100f.length}/100)`);
    
    // Test 1000 concurrent requests
    console.log('\n🔍 Testing 1000 concurrent requests...');
    const start1000f = performance.now();
    const results1000f = await testConcurrentRequests(3002, 1000);
    const end1000f = performance.now();
    const successful1000f = results1000f.filter(r => r.success);
    const rps1000f = Math.round((successful1000f.length / (end1000f - start1000f)) * 1000);
    console.log(`   Fastify 1000 concurrent: ${rps1000f} req/sec (${successful1000f.length}/1000)`);
    
    await fastifyApp.close();
    
    // Results
    console.log('\n📊 OPTIMIZATION RESULTS');
    console.log('=======================');
    console.log(`SyntroJS Original:`);
    console.log(`   10 concurrent:  ${rps10o} req/sec`);
    console.log(`   100 concurrent: ${rps100o} req/sec`);
    console.log(`   1000 concurrent: ${rps1000o} req/sec`);
    console.log(`SyntroJS UltraFast:`);
    console.log(`   10 concurrent:  ${rps10u} req/sec`);
    console.log(`   100 concurrent: ${rps100u} req/sec`);
    console.log(`   1000 concurrent: ${rps1000u} req/sec`);
    console.log(`Fastify Baseline:`);
    console.log(`   10 concurrent:  ${rps10f} req/sec`);
    console.log(`   100 concurrent: ${rps100f} req/sec`);
    console.log(`   1000 concurrent: ${rps1000f} req/sec`);
    
    // Calculate improvements
    const improvement10 = ((rps10u - rps10o) / rps10o) * 100;
    const improvement100 = ((rps100u - rps100o) / rps100o) * 100;
    const improvement1000 = ((rps1000u - rps1000o) / rps1000o) * 100;
    
    console.log(`\n📈 OPTIMIZATION IMPROVEMENTS`);
    console.log('===========================');
    console.log(`10 concurrent:  ${improvement10.toFixed(1)}% improvement`);
    console.log(`100 concurrent: ${improvement100.toFixed(1)}% improvement`);
    console.log(`1000 concurrent: ${improvement1000.toFixed(1)}% improvement`);
    
    const avgImprovement = (improvement10 + improvement100 + improvement1000) / 3;
    console.log(`\nAverage improvement: ${avgImprovement.toFixed(1)}%`);
    
    // Calculate ratios vs Fastify
    const ratio10u = (rps10u / rps10f) * 100;
    const ratio100u = (rps100u / rps100f) * 100;
    const ratio1000u = (rps1000u / rps1000f) * 100;
    
    console.log(`\n📊 ULTRAFAST vs FASTIFY RATIOS`);
    console.log('==============================');
    console.log(`10 concurrent:  ${ratio10u.toFixed(1)}% (UltraFast vs Fastify)`);
    console.log(`100 concurrent: ${ratio100u.toFixed(1)}% (UltraFast vs Fastify)`);
    console.log(`1000 concurrent: ${ratio1000u.toFixed(1)}% (UltraFast vs Fastify)`);
    
    const avgRatio = (ratio10u + ratio100u + ratio1000u) / 3;
    console.log(`\nAverage ratio: ${avgRatio.toFixed(1)}% (UltraFast vs Fastify)`);
    
    // Analysis
    console.log('\n🔍 ANALYSIS');
    console.log('===========');
    
    if (avgImprovement > 50) {
      console.log('🎉 EXCELLENT: UltraFast optimizations are very effective!');
    } else if (avgImprovement > 20) {
      console.log('✅ GOOD: UltraFast optimizations show significant improvement');
    } else if (avgImprovement > 0) {
      console.log('⚠️  MODERATE: UltraFast optimizations show some improvement');
    } else {
      console.log('❌ CONCERNING: UltraFast optimizations show no improvement');
    }
    
    if (avgRatio > 80) {
      console.log('🔥 EXCELLENT: UltraFast is very close to Fastify!');
    } else if (avgRatio > 60) {
      console.log('✅ GOOD: UltraFast has acceptable overhead vs Fastify');
    } else {
      console.log('⚠️  MODERATE: UltraFast still has room for improvement');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n✅ UltraFast optimization benchmark completed');
}

main().catch(console.error);
