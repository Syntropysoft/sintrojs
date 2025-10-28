/**
 * Ejemplo de la nueva API fluida de SyntroJS
 * Demuestra tanto el encadenamiento de métodos como la definición por objetos
 */

import { SyntroJS, HTTPException } from '../../src/index';
import { z } from 'zod';

// ========================================
// 1. API ENCADENADA (Method Chaining)
// ========================================

console.log('🚀 Ejemplo 1: API Encadenada');

const chainedApi = new SyntroJS();

// Encadenamiento fluido completo - configuración + rutas + servidor
chainedApi
  .title('API Encadenada')
  .version('1.0.0')
  .description('Ejemplo de API usando encadenamiento de métodos')
  .logging(true)
  .get('/users', {
    response: z.object({
      users: z.array(z.object({
        id: z.number(),
        name: z.string(),
        email: z.string()
      }))
    }),
    handler: () => ({
      users: [
        { id: 1, name: 'Juan', email: 'juan@example.com' },
        { id: 2, name: 'María', email: 'maria@example.com' }
      ]
    })
  })
  .post('/users', {
    body: z.object({
      name: z.string().min(1),
      email: z.string().email()
    }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string()
    }),
    status: 201,
    handler: ({ body }) => ({
      id: Date.now(),
      name: body.name,
      email: body.email
    })
  })
  .get('/users/:id', {
    params: z.object({ id: z.coerce.number() }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string()
    }),
    handler: ({ params }) => {
      const user = { id: params.id, name: 'Usuario', email: 'user@example.com' };
      if (params.id > 100) {
        throw new HTTPException(404, 'Usuario no encontrado');
      }
      return user;
    }
  })
  .put('/users/:id', {
    params: z.object({ id: z.coerce.number() }),
    body: z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional()
    }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string()
    }),
    handler: ({ params, body }) => ({
      id: params.id,
      name: body.name ?? 'Usuario Actualizado',
      email: body.email ?? 'updated@example.com'
    })
  })
  .delete('/users/:id', {
    params: z.object({ id: z.coerce.number() }),
    status: 204,
    handler: ({ params }) => {
      if (params.id > 100) {
        throw new HTTPException(404, 'Usuario no encontrado');
      }
      return null; // 204 No Content
    }
  });

// ========================================
// 2. API CON OBJETOS (Object-based Routes)
// ========================================

console.log('🎯 Ejemplo 2: API con Objetos');

const objectApi = new SyntroJS({
  routes: {
    '/products': {
      get: {
        response: z.object({
          products: z.array(z.object({
            id: z.number(),
            name: z.string(),
            price: z.number(),
            category: z.string()
          }))
        }),
        handler: () => ({
          products: [
            { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
            { id: 2, name: 'Mouse', price: 29.99, category: 'Electronics' },
            { id: 3, name: 'Desk', price: 199.99, category: 'Furniture' }
          ]
        })
      },
      post: {
        body: z.object({
          name: z.string().min(1),
          price: z.number().positive(),
          category: z.string().min(1)
        }),
        response: z.object({
          id: z.number(),
          name: z.string(),
          price: z.number(),
          category: z.string()
        }),
        status: 201,
        handler: ({ body }) => ({
          id: Date.now(),
          ...body
        })
      }
    },
    '/products/:id': {
      get: {
        params: z.object({ id: z.coerce.number() }),
        response: z.object({
          id: z.number(),
          name: z.string(),
          price: z.number(),
          category: z.string()
        }),
        handler: ({ params }: { params: { id: number } }) => {
          const product = { 
            id: params.id, 
            name: 'Producto', 
            price: 99.99, 
            category: 'General' 
          };
          if (params.id > 1000) {
            throw new HTTPException(404, 'Producto no encontrado');
          }
          return product;
        }
      },
      put: {
        params: z.object({ id: z.coerce.number() }),
        body: z.object({
          name: z.string().min(1).optional(),
          price: z.number().positive().optional(),
          category: z.string().min(1).optional()
        }),
        response: z.object({
          id: z.number(),
          name: z.string(),
          price: z.number(),
          category: z.string()
        }),
        handler: ({ params, body }: { params: { id: number }, body: { name?: string, price?: number, category?: string } }) => ({
          id: params.id,
          name: body.name ?? 'Producto Actualizado',
          price: body.price ?? 99.99,
          category: body.category ?? 'General'
        })
      },
      delete: {
        params: z.object({ id: z.coerce.number() }),
        status: 204,
        handler: ({ params }: { params: { id: number } }) => {
          if (params.id > 1000) {
            throw new HTTPException(404, 'Producto no encontrado');
          }
          return null; // 204 No Content
        }
      }
    },
    '/health': {
      get: {
        response: z.object({
          status: z.literal('ok'),
          timestamp: z.string(),
          uptime: z.number()
        }),
        handler: () => ({
          status: 'ok' as const,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        })
      }
    }
  }
});

// Configurar metadatos usando encadenamiento
objectApi
  .title('API con Objetos')
  .version('1.0.0')
  .description('Ejemplo de API usando definición por objetos')
  .logging(false);

// ========================================
// 3. API HÍBRIDA (Combinando ambos enfoques)
// ========================================

console.log('🔄 Ejemplo 3: API Híbrida');

const hybridApi = new SyntroJS({
  routes: {
    // Rutas base definidas por objeto
    '/api/status': {
      get: {
        response: z.object({ status: z.literal('healthy') }),
        handler: () => ({ status: 'healthy' as const })
      }
    }
  }
});

// Configurar metadatos y rutas adicionales usando encadenamiento
hybridApi
  .title('API Híbrida')
  .version('1.0.0')
  .description('Combinando definición por objetos con encadenamiento')
  .logging(true)
  .get('/api/users', {
    response: z.object({
      message: z.string(),
      count: z.number()
    }),
    handler: () => ({
      message: 'Lista de usuarios',
      count: 42
    })
  })
  .post('/api/users', {
    body: z.object({
      name: z.string(),
      role: z.enum(['admin', 'user', 'guest'])
    }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      role: z.string(),
      createdAt: z.string()
    }),
    status: 201,
    handler: ({ body }) => ({
      id: Math.floor(Math.random() * 1000),
      name: body.name,
      role: body.role,
      createdAt: new Date().toISOString()
    })
  });

// ========================================
// FUNCIÓN PARA DEMOSTRAR LAS APIs
// ========================================

async function demonstrateApis() {
  console.log('\n📚 Documentación disponible en:');
  console.log('  - API Encadenada: http://localhost:3001/docs');
  console.log('  - API con Objetos: http://localhost:3002/docs');
  console.log('  - API Híbrida: http://localhost:3003/docs');
  console.log('  - API Avanzada: http://localhost:3004/docs');

  // Iniciar servidores en puertos diferentes
  try {
    await chainedApi.listen(3001);
    console.log('✅ API Encadenada iniciada en puerto 3001');
  } catch (error) {
    console.error('❌ Error iniciando API Encadenada:', error);
  }

  try {
    await objectApi.listen(3002);
    console.log('✅ API con Objetos iniciada en puerto 3002');
  } catch (error) {
    console.error('❌ Error iniciando API con Objetos:', error);
  }

  try {
    await hybridApi.listen(3003);
    console.log('✅ API Híbrida iniciada en puerto 3003');
  } catch (error) {
    console.error('❌ Error iniciando API Híbrida:', error);
  }

  try {
    await advancedApi.listen(3004);
    console.log('✅ API Avanzada iniciada en puerto 3004');
  } catch (error) {
    console.error('❌ Error iniciando API Avanzada:', error);
  }

  console.log('\n🎉 ¡Todas las APIs están funcionando!');
  console.log('💡 Observa cómo cada enfoque mantiene el Swagger automático');
  console.log('🚀 La API Avanzada muestra todas las capacidades de SyntroJS');
}

// Ejecutar demostración si es el archivo principal
if (require.main === module) {
  demonstrateApis().catch(console.error);
}

// ========================================
// 4. API AVANZADA (Todas las capacidades)
// ========================================

console.log('⭐ Ejemplo 4: API Avanzada');

const advancedApi = new SyntroJS();

// Encadenamiento completo con todas las características
advancedApi
  .title('Mi API Empresarial')
  .version('2.1.0')
  .description('API completa con todas las características de SyntroJS')
  .logging(true)
  
  // Rutas principales
  .get('/api/v1/health', {
    response: z.object({
      status: z.literal('healthy'),
      timestamp: z.string(),
      version: z.string(),
      uptime: z.number()
    }),
    handler: () => ({
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      uptime: process.uptime()
    })
  })
  
  .get('/api/v1/users', {
    query: z.object({
      page: z.coerce.number().min(1).optional(),
      limit: z.coerce.number().min(1).max(100).optional(),
      search: z.string().optional(),
      sortBy: z.enum(['id', 'name', 'email', 'createdAt']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional()
    }),
    response: z.object({
      users: z.array(z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        role: z.enum(['admin', 'user', 'guest']),
        createdAt: z.string()
      })),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number(),
        sortBy: z.string(),
        sortOrder: z.string()
      })
    }),
    handler: ({ query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const total = 42; // Simulado
      const sortBy = query.sortBy ?? 'id';
      const sortOrder = query.sortOrder ?? 'asc';
      
      // Generar datos simulados
      const allUsers = Array.from({ length: total }, (_, i) => ({
        id: i + 1,
        name: `Usuario ${i + 1}`,
        email: `user${i + 1}@empresa.com`,
        role: i === 0 ? 'admin' as const : 'user' as const,
        createdAt: new Date(Date.now() - i * 86400000).toISOString() // Días atrás
      }));
      
      // Aplicar ordenamiento
      const sortedUsers = allUsers.sort((a, b) => {
        let aValue: string | number = a[sortBy];
        let bValue: string | number = b[sortBy];
        
        // Convertir fechas a timestamps para comparación
        if (sortBy === 'createdAt') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        }
        
        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
      
      // Aplicar paginación
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = sortedUsers.slice(startIndex, endIndex);
      
      return {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          sortBy,
          sortOrder
        }
      };
    }
  })
  
  .post('/api/v1/users', {
    body: z.object({
      name: z.string().min(2).max(50),
      email: z.string().email(),
      role: z.enum(['admin', 'user', 'guest']).default('user')
    }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
      createdAt: z.string()
    }),
    status: 201,
    handler: ({ body }) => ({
      id: Date.now(),
      name: body.name,
      email: body.email,
      role: body.role,
      createdAt: new Date().toISOString()
    })
  })
  
  .get('/api/v1/users/:id', {
    params: z.object({ id: z.coerce.number() }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
      createdAt: z.string()
    }),
    handler: ({ params }) => {
      if (params.id > 1000) {
        throw new HTTPException(404, 'Usuario no encontrado');
      }
      
      return {
        id: params.id,
        name: `Usuario ${params.id}`,
        email: `user${params.id}@empresa.com`,
        role: 'user',
        createdAt: new Date().toISOString()
      };
    }
  })
  
  .put('/api/v1/users/:id', {
    params: z.object({ id: z.coerce.number() }),
    body: z.object({
      name: z.string().min(2).max(50).optional(),
      email: z.string().email().optional(),
      role: z.enum(['admin', 'user', 'guest']).optional()
    }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
      updatedAt: z.string()
    }),
    handler: ({ params, body }) => {
      if (params.id > 1000) {
        throw new HTTPException(404, 'Usuario no encontrado');
      }
      
      return {
        id: params.id,
        name: body.name ?? `Usuario ${params.id}`,
        email: body.email ?? `user${params.id}@empresa.com`,
        role: body.role ?? 'user',
        updatedAt: new Date().toISOString()
      };
    }
  })
  
  .delete('/api/v1/users/:id', {
    params: z.object({ id: z.coerce.number() }),
    status: 204,
    handler: ({ params }) => {
      if (params.id > 1000) {
        throw new HTTPException(404, 'Usuario no encontrado');
      }
      return null; // 204 No Content
    }
  })
  
  // Manejo de errores personalizado
  .exceptionHandler(HTTPException, (error, request, reply) => {
    reply.status(error.status).send({
      error: error.message,
      status: error.status,
      timestamp: new Date().toISOString(),
      path: request.url
    });
  });

export { chainedApi, objectApi, hybridApi, advancedApi };
