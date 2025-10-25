/**
 * Test simple para verificar la API fluida de SyntroJS
 * Enfoque simplificado para evitar problemas de rutas de módulos
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SyntroJS } from '../../../src/core';

describe('SyntroJS Fluent API - Simple Test', () => {
  it('should support method chaining', () => {
    const api = new SyntroJS();

    // Verificar que cada método retorna 'this' para encadenamiento
    const result = api
      .title('Test API')
      .version('1.0.0')
      .description('API de prueba')
      .logging(false)
      .get('/test', {
        handler: () => ({ message: 'test' }),
      })
      .post('/test', {
        handler: () => ({ created: true }),
      });

    // Debe retornar la misma instancia
    expect(result).toBe(api);
  });

  it('should support object-based routes', () => {
    const api = new SyntroJS({
      routes: {
        '/products': {
          get: {
            response: z.object({ products: z.array(z.string()) }),
            handler: () => ({ products: ['product1', 'product2'] }),
          },
          post: {
            body: z.object({ name: z.string() }),
            response: z.object({ id: z.number(), name: z.string() }),
            handler: ({ body }) => ({ id: 1, name: body.name }),
          },
        },
      },
    });

    // Verificar que la API se creó correctamente
    expect(api).toBeInstanceOf(SyntroJS);
  });

  it('should generate OpenAPI spec with configuration', () => {
    const api = new SyntroJS();

    api
      .title('Mi API')
      .version('2.0.0')
      .description('API de prueba')
      .get('/health', {
        response: z.object({ status: z.string() }),
        handler: () => ({ status: 'ok' }),
      });

    // Verificar que OpenAPI se genera correctamente
    const spec = api.getOpenAPISpec();

    expect(spec.info.title).toBe('Mi API');
    expect(spec.info.version).toBe('2.0.0');
    expect(spec.info.description).toBe('API de prueba');
    expect(spec.paths).toHaveProperty('/health');
  });

  it('should validate configuration parameters', () => {
    const api = new SyntroJS();

    expect(() => {
      api.title('');
    }).toThrow('Title is required');

    expect(() => {
      api.version('');
    }).toThrow('Version is required');

    expect(() => {
      api.description('');
    }).toThrow('Description is required');
  });

  it('should support hybrid approach', () => {
    const api = new SyntroJS({
      routes: {
        '/api/status': {
          get: {
            response: z.object({ status: z.literal('ok') }),
            handler: () => ({ status: 'ok' as const }),
          },
        },
      },
    });

    // Agregar rutas adicionales con encadenamiento
    api
      .title('API Híbrida')
      .version('1.0.0')
      .get('/api/users', {
        response: z.object({ count: z.number() }),
        handler: () => ({ count: 42 }),
      });

    // Verificar que todo funciona
    const spec = api.getOpenAPISpec();

    expect(spec.info.title).toBe('API Híbrida');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.paths).toHaveProperty('/api/status');
    expect(spec.paths).toHaveProperty('/api/users');
  });
});
