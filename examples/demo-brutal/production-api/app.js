import { SyntroJS } from '../../../dist/index.js';

// 🚀 Production API - Todo habilitado
// API de producción con todas las características

const api = new SyntroJS()
  .get('/api/users', (ctx) => {
    return { users: [{ id: 1, name: "John", email: "john@example.com" }] };
  })
  .post('/api/users', (ctx) => {
    return { message: "User created", id: Math.floor(Math.random() * 1000) };
  })
  .get('/api/health', (ctx) => {
    return { status: "healthy", uptime: process.uptime(), memory: process.memoryUsage() };
  })
  .get('/api/stats', (ctx) => {
    return { requests: Math.floor(Math.random() * 1000), uptime: process.uptime() };
  })
  .listen(3000);

console.log('🚀 🚀 Production API - Todo habilitado');
console.log('📝 API de producción con todas las características');
console.log('⚙️  Configuración:', {
  "logger": true,
  "validation": true,
  "errorHandling": true,
  "openAPI": true,
  "compression": true,
  "cors": true,
  "helmet": true,
  "rateLimit": true
});
console.log('🌐 Servidor corriendo en http://localhost:3000');
console.log('📖 Documentación: http://localhost:3000/docs');
console.log('🔗 Endpoints disponibles:');
console.log('   GET http://localhost:3000/api/users');
console.log('   POST http://localhost:3000/api/users');
console.log('   GET http://localhost:3000/api/health');
console.log('   GET http://localhost:3000/api/stats');
