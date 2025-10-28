import { SyntroJS } from '../../../dist/index.js';
import { performance } from 'perf_hooks';

// ⚡ Standard API - Configuración equilibrada - Benchmark
// API estándar con características esenciales

const api = new SyntroJS()
  .get('/users', (ctx) => {
    return { users: [{ id: 1, name: "John" }, { id: 2, name: "Jane" }] };
  })
  .post('/users', (ctx) => {
    return { message: "User created", id: Math.floor(Math.random() * 1000) };
  })
  .get('/health', (ctx) => {
    return { status: "healthy", uptime: process.uptime() };
  })
  .listen(3000);

console.log('🚀 ⚡ Standard API - Configuración equilibrada - Benchmark Mode');
console.log('📝 API estándar con características esenciales');

// Benchmark function
async function runBenchmark() {
  const baseUrl = 'http://localhost:3000';
  const iterations = 1000;
  
  console.log('\n🔥 Iniciando benchmark...');
  console.log(`📊 Iteraciones: ${iterations}`);
  
  const results = [];
  
  for (const route of [{"method":"GET","path":"/users","handler":"return { users: [{ id: 1, name: \"John\" }, { id: 2, name: \"Jane\" }] };"},{"method":"POST","path":"/users","handler":"return { message: \"User created\", id: Math.floor(Math.random() * 1000) };"},{"method":"GET","path":"/health","handler":"return { status: \"healthy\", uptime: process.uptime() };"}]) {
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
      rps: rps
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
