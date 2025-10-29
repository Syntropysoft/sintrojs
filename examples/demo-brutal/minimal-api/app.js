import { SyntroJS } from '../../../dist/index.js';

// 🔥 Minimal API - Solo lo esencial
// API mínima con tree shaking máximo

const api = new SyntroJS({
  title: 'Minimal API',
  ultraMinimal: true, // Usar UltraMinimalAdapter para máximo performance
});

// Registrar rutas
api.get('/hello', { handler: (ctx) => ({ message: 'Hello from minimal API!' }) });
api.get('/ping', { handler: (ctx) => ({ status: 'ok', timestamp: new Date().toISOString() }) });

// Iniciar servidor
api.listen(3000).then((address) => {
  console.log('🚀 🔥 Minimal API - Solo lo esencial');
  console.log('📝 API mínima con tree shaking máximo');
  console.log(`🌐 Servidor corriendo en ${address}`);
  console.log(`📖 Documentación: ${address}/docs`);
  console.log('🔗 Endpoints disponibles:');
  console.log(`   GET ${address}/hello`);
  console.log(`   GET ${address}/ping`);
  console.log('');
  console.log('💡 Prueba el demo:');
  console.log(`   curl ${address}/hello`);
  console.log(`   curl ${address}/ping`);
});
