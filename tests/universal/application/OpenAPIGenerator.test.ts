/**
 * OpenAPIGenerator tests
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createOpenAPIGenerator } from '../../../src/application/OpenAPIGenerator';
import { Route } from '../../../src/domain/Route';
import type { HttpMethod } from '../../../src/domain/types';

describe('OpenAPIGenerator', () => {
  const generator = createOpenAPIGenerator();

  const createMockRoute = (method: HttpMethod, path: string, config: any = {}) => {
    return new Route(method, path, {
      handler: async () => ({}),
      ...config,
    });
  };

  describe('generate', () => {
    it('should generate basic OpenAPI spec', () => {
      const routes = [
        createMockRoute('GET', '/hello', {
          handler: () => ({ message: 'hello' }),
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      expect(spec.openapi).toBe('3.1.0');
      expect(spec.info.title).toBe('Test API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.paths).toBeDefined();
      expect(spec.paths['/hello']).toBeDefined();
      expect(spec.paths['/hello'].get).toBeDefined();
    });

    it('should include description if provided', () => {
      const spec = generator.generate([], {
        title: 'Test API',
        version: '1.0.0',
        description: 'API description',
      });

      expect(spec.info.description).toBe('API description');
    });

    it('should include servers if provided', () => {
      const servers = [
        { url: 'https://api.example.com', description: 'Production' },
        { url: 'http://localhost:3000', description: 'Development' },
      ];

      const spec = generator.generate([], {
        title: 'Test API',
        version: '1.0.0',
        servers,
      });

      expect(spec.servers).toEqual(servers);
    });

    it('should throw error if routes is null', () => {
      /* config for error cases */
      expect(() => generator.generate(null as any, { title: 'Test', version: '1.0.0' })).toThrow(
        'Routes array is required',
      );
    });

    it('should throw error if config is null', () => {
      /* config for error cases */
      expect(() => generator.generate([], null as any)).toThrow('Config is required');
    });

    it('should throw error if title is missing', () => {
      /* config for error cases */
      expect(() => generator.generate([], { version: '1.0.0' } as any)).toThrow(
        'Config.title is required',
      );
    });

    it('should throw error if version is missing', () => {
      /* config for error cases */
      expect(() => generator.generate([], { title: 'Test' } as any)).toThrow(
        'Config.version is required',
      );
    });
  });

  describe('Path parameters', () => {
    it('should generate path parameters from route', () => {
      const routes = [
        createMockRoute('GET', '/users/:id', {
          params: z.object({ id: z.coerce.number() }),
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/users/:id'].get;
      expect(operation?.parameters).toBeDefined();
      expect(operation?.parameters?.[0].name).toBe('id');
      expect(operation?.parameters?.[0].in).toBe('path');
      expect(operation?.parameters?.[0].required).toBe(true);
    });

    it('should handle multiple path parameters', () => {
      const routes = [
        createMockRoute('GET', '/users/:userId/posts/:postId', {
          params: z.object({
            userId: z.coerce.number(),
            postId: z.coerce.number(),
          }),
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/users/:userId/posts/:postId'].get;
      expect(operation?.parameters).toHaveLength(2);
      expect(operation?.parameters?.[0].name).toBe('userId');
      expect(operation?.parameters?.[1].name).toBe('postId');
    });
  });

  describe('Query parameters', () => {
    it('should generate query parameters', () => {
      const routes = [
        createMockRoute('GET', '/search', {
          query: z.object({
            q: z.string(),
            page: z.coerce.number().optional(),
          }),
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/search'].get;
      expect(operation?.parameters).toBeDefined();

      const qParam = operation?.parameters?.find((p) => p.name === 'q');
      expect(qParam?.in).toBe('query');
      expect(qParam?.required).toBe(true);

      const pageParam = operation?.parameters?.find((p) => p.name === 'page');
      expect(pageParam?.in).toBe('query');
      expect(pageParam?.required).toBe(false);
    });
  });

  describe('Request body', () => {
    it('should generate request body schema', () => {
      const routes = [
        createMockRoute('POST', '/users', {
          body: z.object({
            name: z.string(),
            email: z.string().email(),
          }),
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/users'].post;
      expect(operation?.requestBody).toBeDefined();
      expect(operation?.requestBody?.required).toBe(true);
      expect(operation?.requestBody?.content['application/json'].schema).toBeDefined();
    });
  });

  describe('Response schema', () => {
    it('should generate response schema', () => {
      const routes = [
        createMockRoute('GET', '/users', {
          response: z.object({
            users: z.array(z.object({ id: z.number(), name: z.string() })),
          }),
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/users'].get;
      expect(operation?.responses['200']).toBeDefined();
      expect(operation?.responses['200'].content).toBeDefined();
      expect(operation?.responses['200'].content?.['application/json'].schema).toBeDefined();
    });

    it('should use custom status code if provided', () => {
      const routes = [
        createMockRoute('POST', '/users', {
          status: 201,
          response: z.object({ id: z.number() }),
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/users'].post;
      expect(operation?.responses['201']).toBeDefined();
      expect(operation?.responses['200']).toBeUndefined();
    });
  });

  describe('Metadata', () => {
    it('should include tags', () => {
      const routes = [
        createMockRoute('GET', '/users', {
          tags: ['users', 'public'],
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/users'].get;
      expect(operation?.tags).toEqual(['users', 'public']);
    });

    it('should include summary and description', () => {
      const routes = [
        createMockRoute('GET', '/users', {
          summary: 'List users',
          description: 'Returns all users',
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/users'].get;
      expect(operation?.summary).toBe('List users');
      expect(operation?.description).toBe('Returns all users');
    });

    it('should include operationId', () => {
      const routes = [
        createMockRoute('GET', '/users', {
          operationId: 'listUsers',
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/users'].get;
      expect(operation?.operationId).toBe('listUsers');
    });

    it('should mark as deprecated if specified', () => {
      const routes = [
        createMockRoute('GET', '/old-endpoint', {
          deprecated: true,
        }),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const operation = spec.paths['/old-endpoint'].get;
      expect(operation?.deprecated).toBe(true);
    });
  });

  describe('Multiple routes', () => {
    it('should handle multiple methods on same path', () => {
      const routes = [
        createMockRoute('GET', '/users'),
        createMockRoute('POST', '/users'),
        createMockRoute('PUT', '/users'),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      const path = spec.paths['/users'];
      expect(path.get).toBeDefined();
      expect(path.post).toBeDefined();
      expect(path.put).toBeDefined();
    });

    it('should handle multiple paths', () => {
      const routes = [
        createMockRoute('GET', '/users'),
        createMockRoute('GET', '/posts'),
        createMockRoute('GET', '/comments'),
      ];

      const spec = generator.generate(routes, {
        title: 'Test API',
        version: '1.0.0',
      });

      expect(Object.keys(spec.paths)).toHaveLength(3);
      expect(spec.paths['/users']).toBeDefined();
      expect(spec.paths['/posts']).toBeDefined();
      expect(spec.paths['/comments']).toBeDefined();
    });
  });
});
