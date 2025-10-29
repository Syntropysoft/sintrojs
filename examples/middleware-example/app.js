/**
 * Ejemplo simple de middleware system en SyntroJS
 */

import { SyntroJS } from '../src/core/TinyApi';
import { HTTPException } from '../src/domain/HTTPException';

async function main() {
  const app = new SyntroJS({
    title: 'Middleware Example',
    logger: true,
  });

  // Middleware global - logging
  app.use(async (ctx) => {
    console.log(`🔍 ${ctx.method} ${ctx.path} - ${new Date().toISOString()}`);
  });

  // Middleware para API - autenticación
  app.use('/api', async (ctx) => {
    if (!ctx.headers.authorization) {
      throw new HTTPException(401, 'API key required');
    }
    console.log('✅ API authenticated');
  });

  // Middleware para POST - validación
  app.use(
    '/users',
    async (ctx) => {
      if (ctx.method === 'POST') {
        console.log('📝 Creating user...');
      }
    },
    { method: 'POST' },
  );

  // Rutas
  app.get('/hello', {
    handler: async (ctx) => {
      return { message: 'Hello World!' };
    },
  });

  app.get('/api/data', {
    handler: async (ctx) => {
      return { data: 'Protected data' };
    },
  });

  app.post('/users', {
    handler: async (ctx) => {
      return { message: 'User created', user: ctx.body };
    },
  });

  // Iniciar servidor
  const port = 3000;
  await app.listen(port);
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log('📖 Try these endpoints:');
  console.log('  GET  http://localhost:3000/hello');
  console.log('  GET  http://localhost:3000/api/data (needs Authorization header)');
  console.log('  POST http://localhost:3000/users');
}

main().catch(console.error);
