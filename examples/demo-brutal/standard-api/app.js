import { SyntroJS } from '../../../dist/index.js';

// ⚡ Standard API - Configuración equilibrada
// API estándar con características esenciales

const api = new SyntroJS()
  .get('/users', (ctx) => {
    return {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
    };
  })
  .post('/users', (ctx) => {
    return { message: 'User created', id: Math.floor(Math.random() * 1000) };
  })
  .get('/health', (ctx) => {
    return { status: 'healthy', uptime: process.uptime() };
  })
  .listen(3000);

console.log('🚀 ⚡ Standard API - Configuración equilibrada');
console.log('📝 API estándar con características esenciales');
console.log('⚙️  Configuración:', {
  logger: true,
  validation: true,
  errorHandling: true,
  openAPI: true,
  compression: false,
  cors: false,
  helmet: false,
  rateLimit: false,
});
console.log('🌐 Servidor corriendo en http://localhost:3000');
console.log('📖 Documentación: http://localhost:3000/docs');
console.log('🔗 Endpoints disponibles:');
console.log('   GET http://localhost:3000/users');
console.log('   POST http://localhost:3000/users');
console.log('   GET http://localhost:3000/health');
