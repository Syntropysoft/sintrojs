/**
 * Route entity tests
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Route } from '../../../src/domain/Route';
import type { HttpMethod, RouteConfig } from '../../../src/domain/types';

describe('Route', () => {
  const createMockHandler = () => async () => ({ message: 'test' });

  describe('Constructor', () => {
    it('should create a valid route', () => {
      const config: RouteConfig = {
        handler: createMockHandler(),
      };

      const route = new Route('GET', '/users', config);

      expect(route.method).toBe('GET');
      expect(route.path).toBe('/users');
      expect(route.config).toBe(config);
      expect(route.handler).toBe(config.handler);
    });

    it('should create route with all config options', () => {
      const config: RouteConfig = {
        params: z.object({ id: z.string() }),
        query: z.object({ page: z.number() }),
        body: z.object({ name: z.string() }),
        response: z.object({ id: z.string(), name: z.string() }),
        status: 201,
        handler: createMockHandler(),
        tags: ['users'],
        summary: 'Create user',
        description: 'Creates a new user',
        operationId: 'createUser',
        deprecated: false,
      };

      const route = new Route('POST', '/users', config);

      expect(route.config).toBe(config);
      expect(route.config.status).toBe(201);
      expect(route.config.tags).toEqual(['users']);
    });
  });

  describe('Guard clauses', () => {
    it('should throw error if method is empty', () => {
      const config: RouteConfig = { handler: createMockHandler() };

      expect(() => new Route('' as HttpMethod, '/users', config)).toThrow(
        'Route method is required',
      );
    });

    it('should throw error if path is empty', () => {
      const config: RouteConfig = { handler: createMockHandler() };

      expect(() => new Route('GET', '', config)).toThrow('Route path is required');
    });

    it('should throw error if config is missing', () => {
      expect(() => new Route('GET', '/users', null as any)).toThrow('Route config is required');
    });

    it('should throw error if handler is missing', () => {
      const config = {} as RouteConfig;

      expect(() => new Route('GET', '/users', config)).toThrow('Route handler is required');
    });

    it('should throw error if path does not start with /', () => {
      const config: RouteConfig = { handler: createMockHandler() };

      expect(() => new Route('GET', 'users', config)).toThrow('Route path must start with /');
    });
  });

  describe('Route ID', () => {
    it('should generate unique ID from method and path', () => {
      const route = new Route('GET', '/users/:id', {
        handler: createMockHandler(),
      });

      expect(route.id).toBe('GET:/users/:id');
    });

    it('should generate different IDs for same path but different methods', () => {
      const getRoute = new Route('GET', '/users', {
        handler: createMockHandler(),
      });
      const postRoute = new Route('POST', '/users', {
        handler: createMockHandler(),
      });

      expect(getRoute.id).toBe('GET:/users');
      expect(postRoute.id).toBe('POST:/users');
      expect(getRoute.id).not.toBe(postRoute.id);
    });
  });

  describe('HTTP methods', () => {
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

    it.each(methods)('should support %s method', (method) => {
      const route = new Route(method, '/test', {
        handler: createMockHandler(),
      });

      expect(route.method).toBe(method);
    });
  });

  describe('Path patterns', () => {
    it('should accept simple paths', () => {
      const route = new Route('GET', '/users', {
        handler: createMockHandler(),
      });

      expect(route.path).toBe('/users');
    });

    it('should accept paths with parameters', () => {
      const route = new Route('GET', '/users/:id', {
        handler: createMockHandler(),
      });

      expect(route.path).toBe('/users/:id');
    });

    it('should accept paths with multiple parameters', () => {
      const route = new Route('GET', '/users/:userId/posts/:postId', {
        handler: createMockHandler(),
      });

      expect(route.path).toBe('/users/:userId/posts/:postId');
    });

    it('should accept root path', () => {
      const route = new Route('GET', '/', {
        handler: createMockHandler(),
      });

      expect(route.path).toBe('/');
    });

    it('should accept nested paths', () => {
      const route = new Route('GET', '/api/v1/users', {
        handler: createMockHandler(),
      });

      expect(route.path).toBe('/api/v1/users');
    });
  });
});
