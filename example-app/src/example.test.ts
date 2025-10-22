/**
 * Example Tests with TinyTest
 * Demonstrates how easy testing is with TinyApi
 */

import { describe, test, expect } from 'vitest';
import { TinyTest } from 'tinyapi/testing';
import { inject } from 'tinyapi';
import { z } from 'zod';

// ============================================
// Example 1: Basic Testing
// ============================================

describe('Basic TinyTest Example', () => {
  test('simple GET endpoint', async () => {
    const api = new TinyTest();

    api.get('/hello', {
      handler: () => ({ message: 'Hello World!' }),
    });

    const { status, data } = await api.expectSuccess('GET', '/hello');

    expect(status).toBe(200);
    expect(data.message).toBe('Hello World!');

    await api.close();
  });

  test('POST with validation', async () => {
    const api = new TinyTest();

    api.post('/users', {
      body: z.object({
        name: z.string().min(3),
        email: z.string().email(),
      }),
      status: 201,
      handler: ({ body }) => ({ id: 1, ...body }),
    });

    const { status, data } = await api.expectSuccess('POST', '/users', {
      body: { name: 'Gaby', email: 'gaby@example.com' },
    });

    expect(status).toBe(201);
    expect(data.id).toBe(1);
    expect(data.name).toBe('Gaby');

    await api.close();
  });

  test('validation error', async () => {
    const api = new TinyTest();

    api.post('/users', {
      body: z.object({ email: z.string().email() }),
      handler: ({ body }) => body,
    });

    const { status, data } = await api.expectError('POST', '/users', 422, {
      body: { email: 'invalid-email' },
    });

    expect(status).toBe(422);
    expect(data).toHaveProperty('detail');

    await api.close();
  });
});

// ============================================
// Example 2: Boundary Testing (Kills Mutants!)
// ============================================

describe('Boundary Testing Example', () => {
  test('validates age boundaries', async () => {
    const api = new TinyTest();

    api.post('/users', {
      body: z.object({
        name: z.string(),
        age: z.number().min(18).max(120),
      }),
      handler: ({ body }) => ({ id: 1, ...body }),
    });

    // Test exact boundaries
    await api.testBoundaries('POST', '/users', [
      // Below minimum
      { input: { name: 'Minor', age: 17 }, expected: { success: false, status: 422 } },
      // At minimum
      { input: { name: 'Adult', age: 18 }, expected: { success: true } },
      // Above maximum
      { input: { name: 'TooOld', age: 121 }, expected: { success: false, status: 422 } },
      // At maximum
      { input: { name: 'Senior', age: 120 }, expected: { success: true } },
    ]);

    await api.close();
  });
});

// ============================================
// Example 3: Contract Testing
// ============================================

describe('Contract Testing Example', () => {
  test('response matches schema', async () => {
    const api = new TinyTest();

    const UserResponseSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
      createdAt: z.string().datetime(),
    });

    api.post('/users', {
      body: z.object({ name: z.string(), email: z.string().email() }),
      handler: ({ body }) => ({
        id: 1,
        ...body,
        createdAt: new Date().toISOString(),
      }),
    });

    await api.testContract('POST', '/users', {
      input: { name: 'Gaby', email: 'gaby@example.com' },
      responseSchema: UserResponseSchema,
    });

    await api.close();
  });
});

// ============================================
// Example 4: Dependency Injection
// ============================================

describe('DI Testing Example', () => {
  test('injects dependencies', async () => {
    const api = new TinyTest();

    const getDb = () => ({
      users: { findAll: () => [{ id: 1, name: 'Gaby' }] },
    });

    api.get('/users', {
      dependencies: {
        db: inject(getDb),
      },
      handler: ({ dependencies }) => dependencies.db.users.findAll(),
    });

    const { data } = await api.expectSuccess('GET', '/users');

    expect(data).toEqual([{ id: 1, name: 'Gaby' }]);

    await api.close();
  });

  test('singleton dependency is reused', async () => {
    const api = new TinyTest();

    let instanceCount = 0;

    const getConfig = () => {
      instanceCount++;
      return { env: 'test', instanceId: instanceCount };
    };

    api.get('/config', {
      dependencies: {
        config: inject(getConfig, { scope: 'singleton' }),
      },
      handler: ({ dependencies }) => dependencies.config,
    });

    // First request
    const response1 = await api.request('GET', '/config');

    // Second request
    const response2 = await api.request('GET', '/config');

    // Both should return the same instance
    expect(response1.data.instanceId).toBe(1);
    expect(response2.data.instanceId).toBe(1); // Same singleton
    expect(instanceCount).toBe(1); // Only created once

    await api.close();
  });
});

// ============================================
// Example 5: Background Tasks
// ============================================

describe('Background Tasks Example', () => {
  test('executes background task without blocking', async () => {
    const api = new TinyTest();

    let emailSent = false;

    api.post('/notify', {
      body: z.object({ email: z.string().email() }),
      handler: ({ body, background }) => {
        // Background task: send email (doesn't block response)
        background.addTask(
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            emailSent = true;
          },
          { name: 'send-email' },
        );

        return { status: 'queued', email: body.email };
      },
    });

    const startTime = Date.now();

    const { data } = await api.expectSuccess('POST', '/notify', {
      body: { email: 'gaby@example.com' },
    });

    const responseTime = Date.now() - startTime;

    // Response should be fast (not waiting for background task)
    expect(responseTime).toBeLessThan(50);
    expect(data.status).toBe('queued');

    // Wait for background task to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emailSent).toBe(true);

    await api.close();
  });
});

// ============================================
// Example 6: Property Testing
// ============================================

describe('Property Testing Example', () => {
  test('id is always positive', async () => {
    const api = new TinyTest();

    api.post('/users', {
      body: z.object({ name: z.string(), age: z.number() }),
      handler: ({ body }) => ({
        id: Math.floor(Math.random() * 10000) + 1,
        ...body,
      }),
    });

    await api.testProperty('POST', '/users', {
      schema: z.object({ name: z.string(), age: z.number() }),
      iterations: 20, // Test 20 random inputs
      property: (response) => {
        // These properties must ALWAYS hold
        return response.id > 0 && Number.isInteger(response.id);
      },
    });

    await api.close();
  });
});

// ============================================
// Example 7: Complete CRUD with All Features
// ============================================

describe('Complete CRUD Example', () => {
  test('full user lifecycle', async () => {
    const api = new TinyTest();

    // Mock DB
    const db = new Map<number, any>();
    let nextId = 1;

    const getDb = () => ({
      create: (data: any) => {
        const user = { id: nextId++, ...data };
        db.set(user.id, user);
        return user;
      },
      findById: (id: number) => db.get(id),
      update: (id: number, data: any) => {
        const user = db.get(id);
        if (!user) return null;
        const updated = { ...user, ...data };
        db.set(id, updated);
        return updated;
      },
      delete: (id: number) => db.delete(id),
    });

    // CREATE
    api.post('/users', {
      body: z.object({ name: z.string(), email: z.string().email() }),
      status: 201,
      dependencies: { db: inject(getDb, { scope: 'singleton' }) },
      handler: ({ body, dependencies }) => dependencies.db.create(body),
    });

    // READ
    api.get('/users/:id', {
      params: z.object({ id: z.coerce.number() }),
      dependencies: { db: inject(getDb, { scope: 'singleton' }) },
      handler: ({ params, dependencies }) => {
        const user = dependencies.db.findById(params.id);
        if (!user) throw new NotFoundException();
        return user;
      },
    });

    // UPDATE
    api.put('/users/:id', {
      params: z.object({ id: z.coerce.number() }),
      body: z.object({ name: z.string().optional(), email: z.string().email().optional() }),
      dependencies: { db: inject(getDb, { scope: 'singleton' }) },
      handler: ({ params, body, dependencies }) => {
        const user = dependencies.db.update(params.id, body);
        if (!user) throw new NotFoundException();
        return user;
      },
    });

    // DELETE
    api.delete('/users/:id', {
      params: z.object({ id: z.coerce.number() }),
      dependencies: { db: inject(getDb, { scope: 'singleton' }) },
      handler: ({ params, dependencies }) => {
        const deleted = dependencies.db.delete(params.id);
        if (!deleted) throw new NotFoundException();
        return { deleted: true };
      },
    });

    // Test full lifecycle
    // 1. Create user
    const createResponse = await api.expectSuccess('POST', '/users', {
      body: { name: 'Gaby', email: 'gaby@example.com' },
    });
    expect(createResponse.status).toBe(201);
    const userId = createResponse.data.id;

    // 2. Read user
    const readResponse = await api.expectSuccess('GET', `/users/${userId}`);
    expect(readResponse.data.name).toBe('Gaby');

    // 3. Update user
    const updateResponse = await api.expectSuccess('PUT', `/users/${userId}`, {
      body: { name: 'Gabriel' },
    });
    expect(updateResponse.data.name).toBe('Gabriel');

    // 4. Delete user
    const deleteResponse = await api.expectSuccess('DELETE', `/users/${userId}`);
    expect(deleteResponse.data.deleted).toBe(true);

    // 5. Verify deleted
    await api.expectError('GET', `/users/${userId}`, 404);

    await api.close();
  });
});

