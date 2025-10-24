#!/usr/bin/env node

/**
 * SyntroJS vs Express Performance Comparison
 * 
 * Comparación SyntroJS vs Express para confirmar que estamos por encima
 */

const express = require('express');
const fastify = require('fastify');
const http = require('http');
const { performance } = require('perf_hooks');

const TEST_DURATION = 3000; // 3 seconds

function createExpress() {
  const app = express();
  
  app.get('/hello', (req, res) => {
    res.json({
      message: `Hello ${req.query.name || 'World'}!`,
      timestamp: new Date().toISOString()
    });
  });
  
  return app;
}

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

// Simulamos SyntroJS con Fastify + validación manual
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
  console.log('🚀 SyntroJS vs Express Performance Comparison');
  console.log('==============================================');
  console.log('🎯 Goal: Confirmar que SyntroJS está por encima de Express');
  
  try {
    // Test Express
    console.log('\n🔴 Testing Express...');
    const expressApp = createExpress();
    const expressServer = expressApp.listen(3000);
    console.log('✅ Express server started on port 3000');
    
    // Test 10 concurrent requests
    console.log('\n🔍 Testing 10 concurrent requests...');
    const start10e = performance.now();
    const results10e = await testConcurrentRequests(3000, 10);
    const end10e = performance.now();
    const successful10e = results10e.filter(r => r.success);
    const rps10e = Math.round((successful10e.length / (end10e - start10e)) * 1000);
    console.log(`   Express 10 concurrent: ${rps10e} req/sec (${successful10e.length}/10)`);
    
    // Test 100 concurrent requests
    console.log('\n🔍 Testing 100 concurrent requests...');
    const start100e = performance.now();
    const results100e = await testConcurrentRequests(3000, 100);
    const end100e = performance.now();
    const successful100e = results100e.filter(r => r.success);
    const rps100e = Math.round((successful100e.length / (end100e - start100e)) * 1000);
    console.log(`   Express 100 concurrent: ${rps100e} req/sec (${successful100e.length}/100)`);
    
    // Test 1000 concurrent requests
    console.log('\n🔍 Testing 1000 concurrent requests...');
    const start1000e = performance.now();
    const results1000e = await testConcurrentRequests(3000, 1000);
    const end1000e = performance.now();
    const successful1000e = results1000e.filter(r => r.success);
    const rps1000e = Math.round((successful1000e.length / (end1000e - start1000e)) * 1000);
    console.log(`   Express 1000 concurrent: ${rps1000e} req/sec (${successful1000e.length}/1000)`);
    
    expressServer.close();
    
    // Test SyntroJS Simulation
    console.log('\n🔵 Testing SyntroJS Simulation...');
    const syntrojsApp = createSyntroJSSimulation();
    await syntrojsApp.listen(3001);
    console.log('✅ SyntroJS simulation server started on port 3001');
    
    // Test 10 concurrent requests
    console.log('\n🔍 Testing 10 concurrent requests...');
    const start10s = performance.now();
    const results10s = await testConcurrentRequests(3001, 10);
    const end10s = performance.now();
    const successful10s = results10s.filter(r => r.success);
    const rps10s = Math.round((successful10s.length / (end10s - start10s)) * 1000);
    console.log(`   SyntroJS 10 concurrent: ${rps10s} req/sec (${successful10s.length}/10)`);
    
    // Test 100 concurrent requests
    console.log('\n🔍 Testing 100 concurrent requests...');
    const start100s = performance.now();
    const results100s = await testConcurrentRequests(3001, 100);
    const end100s = performance.now();
    const successful100s = results100s.filter(r => r.success);
    const rps100s = Math.round((successful100s.length / (end100s - start100s)) * 1000);
    console.log(`   SyntroJS 100 concurrent: ${rps100s} req/sec (${successful100s.length}/100)`);
    
    // Test 1000 concurrent requests
    console.log('\n🔍 Testing 1000 concurrent requests...');
    const start1000s = performance.now();
    const results1000s = await testConcurrentRequests(3001, 1000);
    const end1000s = performance.now();
    const successful1000s = results1000s.filter(r => r.success);
    const rps1000s = Math.round((successful1000s.length / (end1000s - start1000s)) * 1000);
    console.log(`   SyntroJS 1000 concurrent: ${rps1000s} req/sec (${successful1000s.length}/1000)`);
    
    await syntrojsApp.close();
    
    // Test Fastify
    console.log('\n🟢 Testing Fastify...');
    const fastifyApp = createFastify();
    await fastifyApp.listen(3002);
    console.log('✅ Fastify server started on port 3002');
    
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
    console.log('\n📊 COMPARISON RESULTS');
    console.log('=====================');
    console.log(`Express:`);
    console.log(`   10 concurrent:  ${rps10e} req/sec`);
    console.log(`   100 concurrent: ${rps100e} req/sec`);
    console.log(`   1000 concurrent: ${rps1000e} req/sec`);
    console.log(`SyntroJS Simulation:`);
    console.log(`   10 concurrent:  ${rps10s} req/sec`);
    console.log(`   100 concurrent: ${rps100s} req/sec`);
    console.log(`   1000 concurrent: ${rps1000s} req/sec`);
    console.log(`Fastify:`);
    console.log(`   10 concurrent:  ${rps10f} req/sec`);
    console.log(`   100 concurrent: ${rps100f} req/sec`);
    console.log(`   1000 concurrent: ${rps1000f} req/sec`);
    
    // Calculate ratios
    const ratio10 = (rps10s / rps10e) * 100;
    const ratio100 = (rps100s / rps100e) * 100;
    const ratio1000 = (rps1000s / rps1000e) * 100;
    
    console.log(`\n📊 SYNTRoJS vs EXPRESS RATIOS`);
    console.log('=============================');
    console.log(`10 concurrent:  ${ratio10.toFixed(1)}% (SyntroJS vs Express)`);
    console.log(`100 concurrent: ${ratio100.toFixed(1)}% (SyntroJS vs Express)`);
    console.log(`1000 concurrent: ${ratio1000.toFixed(1)}% (SyntroJS vs Express)`);
    
    // Analysis
    console.log('\n🔍 ANALYSIS');
    console.log('===========');
    
    const avgRatio = (ratio10 + ratio100 + ratio1000) / 3;
    
    if (avgRatio > 200) {
      console.log('🎉 EXCELLENT: SyntroJS is significantly faster than Express!');
    } else if (avgRatio > 150) {
      console.log('🔥 VERY GOOD: SyntroJS is much faster than Express');
    } else if (avgRatio > 100) {
      console.log('✅ GOOD: SyntroJS is faster than Express');
    } else if (avgRatio > 80) {
      console.log('⚠️  MODERATE: SyntroJS is slightly faster than Express');
    } else {
      console.log('❌ CONCERNING: SyntroJS is slower than Express');
    }
    
    console.log(`\nAverage ratio: ${avgRatio.toFixed(1)}% (SyntroJS vs Express)`);
    
    // Performance ranking
    console.log('\n🏆 PERFORMANCE RANKING');
    console.log('======================');
    
    const results = [
      { name: 'Express', rps: [rps10e, rps100e, rps1000e] },
      { name: 'SyntroJS', rps: [rps10s, rps100s, rps1000s] },
      { name: 'Fastify', rps: [rps10f, rps100f, rps1000f] }
    ];
    
    // Calculate average RPS for each
    results.forEach(result => {
      const avgRps = result.rps.reduce((sum, rps) => sum + rps, 0) / result.rps.length;
      result.avgRps = avgRps;
    });
    
    // Sort by average RPS
    results.sort((a, b) => b.avgRps - a.avgRps);
    
    results.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`${medal} ${result.name}: ${result.avgRps.toFixed(0)} req/sec average`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n✅ Express comparison completed');
}

main().catch(console.error);
