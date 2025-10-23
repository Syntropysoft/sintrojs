/**
 * OpenAPI E2E tests
 * Testing OpenAPI spec generation and endpoint
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ErrorHandler } from '../../src/application/ErrorHandler';
import { RouteRegistry } from '../../src/application/RouteRegistry';
import { TinyApi } from '../../src/core/TinyApi';

describe('OpenAPI E2E', () => {
  let app: TinyApi;
  let server: string;

  beforeEach(() => {
    app = new TinyApi({
      title: 'Test API',
      version: '1.0.0',
      description: 'API for testing',
    });
    RouteRegistry.clear();
    ErrorHandler.clearCustomHandlers();
  });

  afterEach(async () => {
    if (server) {
      try {
        await app.close();
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should serve OpenAPI spec at /openapi.json', async () => {
    app.get('/users', {
      tags: ['users'],
      summary: 'List users',
      handler: () => ({ users: [] }),
    });

    server = await app.listen(0);
    const port = new URL(server).port;

    const response = await fetch(`http://localhost:${port}/openapi.json`);
    const spec = await response.json();

    expect(response.status).toBe(200);
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Test API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.info.description).toBe('API for testing');
    expect(spec.paths['/users']).toBeDefined();
    expect(spec.paths['/users'].get).toBeDefined();
  });

  it('should include route metadata in spec', async () => {
    app.get('/users/:id', {
      params: z.object({ id: z.coerce.number() }),
      response: z.object({ id: z.number(), name: z.string() }),
      tags: ['users'],
      summary: 'Get user by ID',
      description: 'Returns a single user',
      handler: ({ params }) => ({ id: params.id, name: 'Test' }),
    });

    server = await app.listen(0);
    const port = new URL(server).port;

    const response = await fetch(`http://localhost:${port}/openapi.json`);
    const spec = await response.json();

    const operation = spec.paths['/users/:id'].get;

    expect(operation.summary).toBe('Get user by ID');
    expect(operation.description).toBe('Returns a single user');
    expect(operation.tags).toEqual(['users']);
    expect(operation.parameters).toBeDefined();
    expect(operation.parameters[0].name).toBe('id');
    expect(operation.responses['200']).toBeDefined();
  });

  it('should handle multiple routes in spec', async () => {
    app.get('/users', { handler: () => [] });
    app.post('/users', { handler: () => ({}) });
    app.get('/posts', { handler: () => [] });

    server = await app.listen(0);
    const port = new URL(server).port;

    const response = await fetch(`http://localhost:${port}/openapi.json`);
    const spec = await response.json();

    expect(spec.paths['/users'].get).toBeDefined();
    expect(spec.paths['/users'].post).toBeDefined();
    expect(spec.paths['/posts'].get).toBeDefined();
  });

  it('should use custom status codes in responses', async () => {
    app.post('/users', {
      status: 201,
      response: z.object({ id: z.number() }),
      handler: () => ({ id: 1 }),
    });

    server = await app.listen(0);
    const port = new URL(server).port;

    const response = await fetch(`http://localhost:${port}/openapi.json`);
    const spec = await response.json();

    const operation = spec.paths['/users'].post;

    expect(operation.responses['201']).toBeDefined();
    expect(operation.responses['200']).toBeUndefined();
  });
});
