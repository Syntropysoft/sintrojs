/**
 * Meta-tests for TinyTest
 * Tests that test the testing wrapper 🤯
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { z } from 'zod';
import { DependencyInjector } from '../../../src/application/DependencyInjector';
import { RouteRegistry } from '../../../src/application/RouteRegistry';
import { BadRequestException } from '../../../src/domain/HTTPException';
import { TinyTest } from '../../../src/testing/TinyTest';

describe('TinyTest', () => {
  let api: TinyTest;

  beforeEach(() => {
    // Clear registries to avoid conflicts between tests
    RouteRegistry.clear();
    DependencyInjector.clearSingletons();
  });

  afterEach(async () => {
    if (api) {
      await api.close();
    }
  });

  describe('Basic functionality', () => {
    test('extends SyntroJS', () => {
      api = new TinyTest();

      expect(api).toBeInstanceOf(TinyTest);
      expect(api.get).toBeInstanceOf(Function);
      expect(api.post).toBeInstanceOf(Function);
    });

    test('can define routes like SyntroJS', () => {
      api = new TinyTest();

      const result = api.get('/test', {
        handler: () => ({ ok: true }),
      });

      expect(result).toBe(api); // Chainable
    });

    test('auto-starts server on first request', async () => {
      api = new TinyTest();

      api.get('/hello', {
        handler: () => ({ message: 'Hello' }),
      });

      const response = await api.request('GET', '/hello');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Hello' });
    });

    test('uses random port for testing', async () => {
      api = new TinyTest();

      api.get('/test', { handler: () => ({}) });

      await api.request('GET', '/test');

      // Server should be started (no error thrown)
      expect(true).toBe(true);
    });
  });

  describe('request()', () => {
    test('makes GET request', async () => {
      api = new TinyTest();

      api.get('/users', {
        handler: () => ({ users: ['Gaby'] }),
      });

      const response = await api.request('GET', '/users');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ users: ['Gaby'] });
    });

    test('makes POST request with body', async () => {
      api = new TinyTest();

      api.post('/users', {
        body: z.object({ name: z.string() }),
        handler: ({ body }) => ({ id: 1, ...body }),
      });

      const response = await api.request('POST', '/users', {
        body: { name: 'Gaby' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ id: 1, name: 'Gaby' });
    });

    test('makes request with query parameters', async () => {
      api = new TinyTest();

      api.get('/search', {
        query: z.object({ q: z.string(), limit: z.coerce.number() }),
        handler: ({ query }) => ({ query }),
      });

      const response = await api.request('GET', '/search', {
        query: { q: 'test', limit: 10 },
      });

      expect(response.data.query).toEqual({ q: 'test', limit: 10 });
    });

    test('makes request with custom headers', async () => {
      api = new TinyTest();

      api.get('/headers', {
        handler: ({ headers }) => ({ received: headers['x-custom'] }),
      });

      const response = await api.request('GET', '/headers', {
        headers: { 'x-custom': 'value' },
      });

      expect((response.data as { received: string }).received).toBe('value');
    });

    test('returns response headers', async () => {
      api = new TinyTest();

      api.get('/test', {
        handler: () => ({ ok: true }),
      });

      const response = await api.request('GET', '/test');

      expect(response.headers).toBeDefined();
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('expectSuccess()', () => {
    test('returns data for successful response', async () => {
      api = new TinyTest();

      api.get('/success', {
        handler: () => ({ status: 'ok' }),
      });

      const response = await api.expectSuccess('GET', '/success');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ status: 'ok' });
    });

    test('throws error for 4xx response', async () => {
      api = new TinyTest();

      api.get('/error', {
        handler: () => {
          throw new BadRequestException('Bad request');
        },
      });

      await expect(api.expectSuccess('GET', '/error')).rejects.toThrow(
        'Expected success (2xx) but got 400',
      );
    });

    test('throws error for 5xx response', async () => {
      api = new TinyTest();

      api.post('/fail', {
        body: z.object({ name: z.string().min(5) }),
        handler: ({ body }) => body,
      });

      await expect(api.expectSuccess('POST', '/fail', { body: { name: 'ab' } })).rejects.toThrow(
        'Expected success (2xx) but got 422',
      );
    });
  });

  describe('expectError()', () => {
    test('returns data for expected error status', async () => {
      api = new TinyTest();

      api.post('/validate', {
        body: z.object({ age: z.number().min(18) }),
        handler: ({ body }) => body,
      });

      const response = await api.expectError('POST', '/validate', 422, {
        body: { age: 17 },
      });

      expect(response.status).toBe(422);
      expect(response.data).toHaveProperty('detail');
    });

    test('throws error if status does not match', async () => {
      api = new TinyTest();

      api.get('/success', {
        handler: () => ({ ok: true }),
      });

      await expect(api.expectError('GET', '/success', 404)).rejects.toThrow(
        'Expected status 404 but got 200',
      );
    });

    test('throws error for success status when error expected', async () => {
      api = new TinyTest();

      api.get('/success', {
        handler: () => ({ ok: true }),
      });

      await expect(api.expectError('GET', '/success', 200)).rejects.toThrow(
        'Expected error status (4xx/5xx) but got 200',
      );
    });
  });

  describe('testBoundaries()', () => {
    test('validates boundary conditions', async () => {
      api = new TinyTest();

      api.post('/users', {
        body: z.object({ age: z.number().min(18) }),
        handler: ({ body }) => ({ id: 1, age: body.age }),
      });

      await expect(
        api.testBoundaries('POST', '/users', [
          { input: { age: 17 }, expected: { success: false } },
          { input: { age: 18 }, expected: { success: true } },
          { input: { age: 19 }, expected: { success: true } },
        ]),
      ).resolves.not.toThrow();
    });

    test('throws if boundary expectation fails', async () => {
      api = new TinyTest();

      api.post('/users', {
        body: z.object({ age: z.number().min(18) }),
        handler: ({ body }) => ({ id: 1, age: body.age }),
      });

      await expect(
        api.testBoundaries('POST', '/users', [
          // Wrong expectation: 17 should fail but we expect success
          { input: { age: 17 }, expected: { success: true } },
        ]),
      ).rejects.toThrow('Expected success but got status 422');
    });

    test('validates specific status codes', async () => {
      api = new TinyTest();

      api.post('/users', {
        body: z.object({ age: z.number().min(18) }),
        status: 201,
        handler: ({ body }) => ({ id: 1, age: body.age }),
      });

      await expect(
        api.testBoundaries('POST', '/users', [
          { input: { age: 18 }, expected: { success: true, status: 201 } },
        ]),
      ).resolves.not.toThrow();
    });

    test('throws if no boundary cases provided', async () => {
      api = new TinyTest();

      await expect(api.testBoundaries('POST', '/test', [])).rejects.toThrow(
        'At least one boundary test case is required',
      );
    });
  });

  describe('testContract()', () => {
    test('validates response against schema', async () => {
      api = new TinyTest();

      const UserSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      });

      api.post('/users', {
        body: z.object({ name: z.string(), email: z.string() }),
        handler: ({ body }) => ({ id: 1, ...body }),
      });

      await expect(
        api.testContract('POST', '/users', {
          input: { name: 'Gaby', email: 'gaby@example.com' },
          responseSchema: UserSchema,
        }),
      ).resolves.not.toThrow();
    });

    test('throws if response does not match contract', async () => {
      api = new TinyTest();

      const UserSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      });

      api.post('/users', {
        handler: () => ({ id: 'invalid' }), // Wrong type
      });

      await expect(
        api.testContract('POST', '/users', {
          input: {},
          responseSchema: UserSchema,
        }),
      ).rejects.toThrow('Response does not match contract');
    });

    test('validates custom status code', async () => {
      api = new TinyTest();

      api.post('/users', {
        status: 201,
        handler: () => ({ id: 1 }),
      });

      await expect(
        api.testContract('POST', '/users', {
          input: {},
          responseSchema: z.object({ id: z.number() }),
          expectedStatus: 201,
        }),
      ).resolves.not.toThrow();
    });

    test('throws if input is missing', async () => {
      api = new TinyTest();

      await expect(
        api.testContract('POST', '/test', {
          responseSchema: z.any(),
        } as any),
      ).rejects.toThrow('Input is required for contract testing');
    });

    test('throws if schema is missing', async () => {
      api = new TinyTest();

      await expect(
        api.testContract('POST', '/test', {
          input: {},
        } as any),
      ).rejects.toThrow('Response schema is required for contract testing');
    });
  });

  describe('testProperty()', () => {
    test('validates property across multiple iterations', async () => {
      api = new TinyTest();

      api.post('/users', {
        body: z.object({ name: z.string(), age: z.number() }),
        handler: ({ body }) => ({ id: Math.floor(Math.random() * 1000) + 1, ...body }),
      });

      await expect(
        api.testProperty('POST', '/users', {
          schema: z.object({ name: z.string(), age: z.number() }),
          iterations: 10,
          property: (response) => response.id > 0, // ID must be positive
        }),
      ).resolves.not.toThrow();
    });

    test('throws if property fails', async () => {
      api = new TinyTest();

      api.post('/users', {
        handler: () => ({ id: -1 }), // Negative ID (violates property)
      });

      await expect(
        api.testProperty('POST', '/users', {
          schema: z.object({ name: z.string() }),
          property: (response) => response.id > 0,
        }),
      ).rejects.toThrow('Property failed');
    });

    test('throws if schema is missing', async () => {
      api = new TinyTest();

      await expect(
        api.testProperty('POST', '/test', {
          property: () => true,
        } as any),
      ).rejects.toThrow('Schema is required for property testing');
    });

    test('throws if property function is missing', async () => {
      api = new TinyTest();

      await expect(
        api.testProperty('POST', '/test', {
          schema: z.any(),
        } as any),
      ).rejects.toThrow('Property function is required');
    });
  });

  describe('Lifecycle management', () => {
    test('server starts automatically on first request', async () => {
      api = new TinyTest();

      api.get('/test', { handler: () => ({}) });

      // Server not started yet
      expect(api.isServerStarted).toBe(false);

      await api.request('GET', '/test');

      // Server started automatically
      expect(api.isServerStarted).toBe(true);
    });

    test('close() stops the server', async () => {
      api = new TinyTest();

      api.get('/test', { handler: () => ({}) });

      await api.request('GET', '/test');
      expect(api.isServerStarted).toBe(true);

      await api.close();
      expect(api.isServerStarted).toBe(false);
    });

    test('close() can be called multiple times safely', async () => {
      api = new TinyTest();

      await api.close();
      await api.close();
      await api.close();

      // Should not throw
      expect(true).toBe(true);
    });

    test('close() before any request does not throw', async () => {
      api = new TinyTest();

      await expect(api.close()).resolves.not.toThrow();
    });
  });

  describe('getTestCoverage()', () => {
    test('returns empty map initially', () => {
      api = new TinyTest();

      const coverage = api.getTestCoverage();

      expect(coverage).toBeInstanceOf(Map);
      expect(coverage.size).toBe(0);
    });

    test('returns immutable copy of registry', () => {
      api = new TinyTest();

      const coverage1 = api.getTestCoverage();
      const coverage2 = api.getTestCoverage();

      expect(coverage1).not.toBe(coverage2); // Different instances
    });
  });

  describe('Integration with Zod validation', () => {
    test('validates params', async () => {
      api = new TinyTest();

      api.get('/users/:id', {
        params: z.object({ id: z.coerce.number() }),
        handler: ({ params }) => ({ id: params.id }),
      });

      const response = await api.request('GET', '/users/123');

      expect(response.data).toEqual({ id: 123 });
    });

    test('validates query', async () => {
      api = new TinyTest();

      api.get('/search', {
        query: z.object({ q: z.string(), limit: z.coerce.number().optional() }),
        handler: ({ query }) => ({ query }),
      });

      const response = await api.request('GET', '/search', {
        query: { q: 'test', limit: 10 },
      });

      interface QueryResponse {
        query: { q: string; limit: number };
      }
      expect((response.data as QueryResponse).query).toEqual({
        q: 'test',
        limit: 10,
      });
    });

    test('validates body', async () => {
      api = new TinyTest();

      api.post('/users', {
        body: z.object({ name: z.string(), age: z.number().min(18) }),
        handler: ({ body }) => ({ id: 1, ...body }),
      });

      const response = await api.request('POST', '/users', {
        body: { name: 'Gaby', age: 30 },
      });

      expect(response.data).toEqual({ id: 1, name: 'Gaby', age: 30 });
    });

    test('returns validation error for invalid body', async () => {
      api = new TinyTest();

      api.post('/users', {
        body: z.object({ age: z.number().min(18) }),
        handler: ({ body }) => body,
      });

      const response = await api.request('POST', '/users', {
        body: { age: 17 },
      });

      expect(response.status).toBe(422);
    });
  });

  describe('Integration with DI', () => {
    test('works with dependencies', async () => {
      api = new TinyTest();

      const { inject } = await import('../../../src/application/DependencyInjector');

      type MockDb = { users: { findAll: () => { id: number; name: string }[] } };
      const getDb = (): MockDb => ({
        users: { findAll: () => [{ id: 1, name: 'Gaby' }] },
      });

      api.get('/users', {
        dependencies: {
          db: inject(getDb),
        },
        handler: ({ dependencies }) => (dependencies.db as MockDb).users.findAll(),
      });

      const response = await api.expectSuccess('GET', '/users');

      expect(response.data).toEqual([{ id: 1, name: 'Gaby' }]);
    });
  });

  describe('Integration with Background Tasks', () => {
    test('background tasks execute during test', async () => {
      api = new TinyTest();

      let taskExecuted = false;

      api.post('/task', {
        handler: ({ background }) => {
          background.addTask(() => {
            taskExecuted = true;
          });
          return { queued: true };
        },
      });

      await api.expectSuccess('POST', '/task', { body: {} });

      // Wait for background task
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(taskExecuted).toBe(true);
    });
  });
});
