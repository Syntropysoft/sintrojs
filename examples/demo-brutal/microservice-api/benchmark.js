import { performance } from 'node:perf_hooks';
import { SyntroJS } from '../../../dist/index.js';

// ⚡ Microservice API - Optimizado para servicios - Benchmark
// API optimizada para microservicios

const api = new SyntroJS()
  .get('/service/status', (ctx) => {
    return { service: 'user-service', version: '1.0.0', status: 'running' };
  })
  .get('/service/metrics', (ctx) => {
    return { requests: Math.floor(Math.random() * 100), errors: Math.floor(Math.random() * 5) };
  })
  .post('/service/health', (ctx) => {
    return { health: 'ok', timestamp: new Date().toISOString() };
  })
  .listen(3000);

console.log('🚀 ⚡ Microservice API - Optimizado para servicios - Benchmark Mode');
console.log('📝 API optimizada para microservicios');

// Benchmark function
async function runBenchmark() {
  const baseUrl = 'http://localhost:3000';
  const iterations = 1000;

  console.log('\n🔥 Iniciando benchmark...');
  console.log(`📊 Iteraciones: ${iterations}`);

  const results = [];

  for (const route of [
    {
      method: 'GET',
      path: '/service/status',
      handler: 'return { service: "user-service", version: "1.0.0", status: "running" };',
    },
    {
      method: 'GET',
      path: '/service/metrics',
      handler:
        'return { requests: Math.floor(Math.random() * 100), errors: Math.floor(Math.random() * 5) };',
    },
    {
      method: 'POST',
      path: '/service/health',
      handler: 'return { health: "ok", timestamp: new Date().toISOString() };',
    },
  ]) {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      try {
        const response = await fetch(`${baseUrl}${route.path}`);
        await response.text();
      } catch (error) {
        console.error(`Error en ${route.path}:`, error.message);
      }
    }

    const end = performance.now();
    const duration = end - start;
    const rps = Math.round((iterations / duration) * 1000);

    results.push({
      route: route.path,
      method: route.method,
      duration: Math.round(duration),
      rps: rps,
    });

    console.log(`✅ ${route.method} ${route.path}: ${rps} req/sec`);
  }

  console.log('\n📊 Resultados del Benchmark:');
  console.table(results);

  const totalRPS = results.reduce((sum, r) => sum + r.rps, 0);
  const avgRPS = Math.round(totalRPS / results.length);

  console.log(`\n🚀 Performance Total: ${totalRPS} req/sec`);
  console.log(`⚡ Performance Promedio: ${avgRPS} req/sec`);

  // Detener el servidor
  process.exit(0);
}

// Ejecutar benchmark después de un delay
setTimeout(runBenchmark, 2000);
