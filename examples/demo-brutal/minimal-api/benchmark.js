import { SyntroJS } from '../../../dist/index.js';

// 🔥 Minimal API - Benchmark Mode
// API mínima con tree shaking máximo

const api = new SyntroJS({
  title: 'Minimal API',
  ultraMinimal: true, // Usar UltraMinimalAdapter para máximo performance
});

// Registrar rutas
api.get('/hello', { handler: (ctx) => ({ message: 'Hello from minimal API!' }) });
api.get('/ping', { handler: (ctx) => ({ status: 'ok', timestamp: new Date().toISOString() }) });

// Iniciar servidor
api.listen(3000).then(async (address) => {
  console.log('🚀 🔥 Minimal API - Benchmark Mode');
  console.log('📝 API mínima con tree shaking máximo');
  console.log(`🌐 Servidor corriendo en ${address}`);

  // Esperar un poco para que el servidor esté listo
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('\n🔥 Iniciando benchmark...');

  const baseUrl = 'http://localhost:3000';
  const iterations = 1000;
  const routes = [
    { path: '/hello', method: 'GET' },
    { path: '/ping', method: 'GET' },
  ];

  console.log(`📊 Iteraciones: ${iterations}`);
  console.log(`🎯 Rutas: ${routes.length}`);

  const results = [];

  for (const route of routes) {
    console.log(`\n⚡ Probando ${route.method} ${route.path}...`);

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      try {
        const response = await fetch(`${baseUrl}${route.path}`);
        await response.text();
      } catch (error) {
        console.error(`❌ Error en ${route.path}:`, error.message);
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
  console.log('─'.repeat(60));
  console.log('Ruta                    | Método | Duración (ms) | RPS');
  console.log('─'.repeat(60));

  results.forEach((result) => {
    console.log(
      `${result.route.padEnd(24)} | ${result.method.padEnd(6)} | ${result.duration.toString().padStart(13)} | ${result.rps}`,
    );
  });

  const totalRPS = results.reduce((sum, r) => sum + r.rps, 0);
  const avgRPS = Math.round(totalRPS / results.length);

  console.log('─'.repeat(60));
  console.log(`🚀 Performance Total: ${totalRPS} req/sec`);
  console.log(`⚡ Performance Promedio: ${avgRPS} req/sec`);

  // Detectar runtime
  const runtime = typeof Bun !== 'undefined' ? 'Bun' : 'Node.js';
  console.log(`🔥 Runtime: ${runtime}`);

  if (runtime === 'Bun') {
    console.log('🎯 Bun: Optimizado con JavaScriptCore');
    console.log('⚡ Native serialization y HTTP server');
  } else {
    console.log('🎯 Node.js: Optimizado con V8');
    console.log('⚡ FastifyAdapter con Zod validation');
  }

  console.log('\n🚀 ¡Benchmark completado!');

  // Detener el servidor
  process.exit(0);
});
