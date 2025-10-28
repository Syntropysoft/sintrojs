import { SyntroJS } from '../../../dist/index.js';

// ⚡ Microservice API - Optimizado para servicios
// API optimizada para microservicios

const api = new SyntroJS()
  .get('/service/status', (ctx) => {
    return { service: "user-service", version: "1.0.0", status: "running" };
  })
  .get('/service/metrics', (ctx) => {
    return { requests: Math.floor(Math.random() * 100), errors: Math.floor(Math.random() * 5) };
  })
  .post('/service/health', (ctx) => {
    return { health: "ok", timestamp: new Date().toISOString() };
  })
  .listen(3000);

console.log('🚀 ⚡ Microservice API - Optimizado para servicios');
console.log('📝 API optimizada para microservicios');
console.log('⚙️  Configuración:', {
  "logger": true,
  "validation": true,
  "errorHandling": true,
  "openAPI": false,
  "compression": true,
  "cors": true,
  "helmet": true,
  "rateLimit": false
});
console.log('🌐 Servidor corriendo en http://localhost:3000');
console.log('📖 Documentación: http://localhost:3000/docs');
console.log('🔗 Endpoints disponibles:');
console.log('   GET http://localhost:3000/service/status');
console.log('   GET http://localhost:3000/service/metrics');
console.log('   POST http://localhost:3000/service/health');
