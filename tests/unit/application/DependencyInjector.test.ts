/**
 * Tests for DependencyInjector
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createDependencyInjector, inject } from '../../../src/application/DependencyInjector';
import type { RequestContext } from '../../../src/domain/types';

describe('DependencyInjector', () => {
  let injector: ReturnType<typeof createDependencyInjector>;
  let mockContext: RequestContext;

  beforeEach(() => {
    injector = createDependencyInjector();
    mockContext = {
      method: 'GET',
      path: '/test',
      params: {},
      query: {},
      body: {},
      headers: {},
      cookies: {},
      correlationId: 'test-123',
      timestamp: new Date(),
      dependencies: {},
    };
  });

  describe('inject() helper', () => {
    test('creates dependency with request scope by default', () => {
      const factory = () => ({ db: 'connection' });
      const dep = inject(factory);

      expect(dep.provider.factory).toBe(factory);
      expect(dep.provider.scope).toBe('request');
      expect(dep.provider.cleanup).toBeUndefined();
    });

    test('creates dependency with singleton scope', () => {
      const factory = () => ({ config: 'value' });
      const dep = inject(factory, { scope: 'singleton' });

      expect(dep.provider.scope).toBe('singleton');
    });

    test('creates dependency with cleanup function', () => {
      const cleanup = () => console.log('cleanup');
      const dep = inject(() => ({}), { cleanup });

      expect(dep.provider.cleanup).toBe(cleanup);
    });

    test('throws error if factory is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => inject(null as any)).toThrow('Factory function is required');
    });

    test('throws error if factory is undefined', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => inject(undefined as any)).toThrow('Factory function is required');
    });
  });

  describe('resolve()', () => {
    test('resolves simple request-scoped dependency', async () => {
      const dep = inject(() => ({ value: 'test' }));

      const { resolved, cleanup } = await injector.resolve(
        { myDep: dep },
        mockContext,
      );

      expect(resolved.myDep).toEqual({ value: 'test' });
      expect(cleanup).toBeInstanceOf(Function);
    });

    test('resolves async dependency', async () => {
      const dep = inject(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { async: true };
      });

      const { resolved } = await injector.resolve({ myDep: dep }, mockContext);

      expect(resolved.myDep).toEqual({ async: true });
    });

    test('resolves multiple dependencies', async () => {
      const db = inject(() => ({ name: 'db' }));
      const cache = inject(() => ({ name: 'cache' }));
      const logger = inject(() => ({ name: 'logger' }));

      const { resolved } = await injector.resolve(
        { db, cache, logger },
        mockContext,
      );

      expect(resolved.db).toEqual({ name: 'db' });
      expect(resolved.cache).toEqual({ name: 'cache' });
      expect(resolved.logger).toEqual({ name: 'logger' });
    });

    test('resolves singleton dependency only once', async () => {
      let callCount = 0;
      const dep = inject(
        () => {
          callCount++;
          return { callCount };
        },
        { scope: 'singleton' },
      );

      // First request
      const result1 = await injector.resolve({ myDep: dep }, mockContext);

      // Second request (should use cached instance)
      const result2 = await injector.resolve({ myDep: dep }, mockContext);

      expect(callCount).toBe(1); // Factory called only once
      expect(result1.resolved.myDep).toBe(result2.resolved.myDep); // Same instance
    });

    test('creates new instance for request-scoped dependency on each request', async () => {
      let callCount = 0;
      const dep = inject(() => {
        callCount++;
        return { callCount };
      });

      // First request
      const result1 = await injector.resolve({ myDep: dep }, mockContext);

      // Second request (should create new instance)
      const result2 = await injector.resolve({ myDep: dep }, mockContext);

      expect(callCount).toBe(2); // Factory called twice
      expect(result1.resolved.myDep).not.toBe(result2.resolved.myDep); // Different instances
    });

    test('calls cleanup functions in reverse order', async () => {
      const cleanupOrder: number[] = [];

      const dep1 = inject(() => ({ name: 'dep1' }), {
        cleanup: async () => {
          cleanupOrder.push(1);
        },
      });

      const dep2 = inject(() => ({ name: 'dep2' }), {
        cleanup: async () => {
          cleanupOrder.push(2);
        },
      });

      const { cleanup } = await injector.resolve({ dep1, dep2 }, mockContext);

      await cleanup();

      // Should cleanup in reverse order (LIFO)
      expect(cleanupOrder).toEqual([2, 1]);
    });

    test('handles async cleanup functions', async () => {
      let cleanedUp = false;

      const dep = inject(() => ({ value: 'test' }), {
        cleanup: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          cleanedUp = true;
        },
      });

      const { cleanup } = await injector.resolve({ myDep: dep }, mockContext);

      await cleanup();

      expect(cleanedUp).toBe(true);
    });

    test('dependency factory receives request context', async () => {
      let receivedContext: RequestContext | undefined;

      const dep = inject((context) => {
        receivedContext = context;
        return { ok: true };
      });

      await injector.resolve({ myDep: dep }, mockContext);

      expect(receivedContext).toBe(mockContext);
    });

    test('throws error if dependencies object is null', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      await expect(injector.resolve(null as any, mockContext)).rejects.toThrow(
        'Dependencies object is required',
      );
    });

    test('throws error if context is null', async () => {
      const dep = inject(() => ({}));

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      await expect(injector.resolve({ myDep: dep }, null as any)).rejects.toThrow(
        'Request context is required',
      );
    });

    test('throws error if provider is missing', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      await expect(injector.resolve({ myDep: {} as any }, mockContext)).rejects.toThrow(
        "Provider for dependency 'myDep' is required",
      );
    });

    test('throws error if factory is missing', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      await expect(
        injector.resolve({ myDep: { provider: { scope: 'request' } } as any }, mockContext),
      ).rejects.toThrow("Factory function for dependency 'myDep' is required");
    });

    test('resolves empty dependencies object', async () => {
      const { resolved } = await injector.resolve({}, mockContext);

      expect(resolved).toEqual({});
    });
  });

  describe('clearSingletons()', () => {
    test('clears singleton cache', async () => {
      const dep = inject(() => ({ value: 'test' }), { scope: 'singleton' });

      // First resolve
      await injector.resolve({ myDep: dep }, mockContext);
      expect(injector.getSingletonCount()).toBe(1);

      // Clear cache
      injector.clearSingletons();
      expect(injector.getSingletonCount()).toBe(0);

      // Next resolve should create new instance
      await injector.resolve({ myDep: dep }, mockContext);
      expect(injector.getSingletonCount()).toBe(1);
    });

    test('does not affect request-scoped dependencies', async () => {
      const dep = inject(() => ({ value: 'test' })); // Request scope

      await injector.resolve({ myDep: dep }, mockContext);
      
      injector.clearSingletons();
      
      expect(injector.getSingletonCount()).toBe(0);
    });
  });

  describe('getSingletonCount()', () => {
    test('returns 0 initially', () => {
      expect(injector.getSingletonCount()).toBe(0);
    });

    test('increments when singleton is created', async () => {
      const dep1 = inject(() => ({ name: 'dep1' }), { scope: 'singleton' });
      const dep2 = inject(() => ({ name: 'dep2' }), { scope: 'singleton' });

      await injector.resolve({ dep1 }, mockContext);
      expect(injector.getSingletonCount()).toBe(1);

      await injector.resolve({ dep2 }, mockContext);
      expect(injector.getSingletonCount()).toBe(2);
    });

    test('does not increment for request-scoped dependencies', async () => {
      const dep = inject(() => ({ value: 'test' })); // Request scope

      await injector.resolve({ myDep: dep }, mockContext);

      expect(injector.getSingletonCount()).toBe(0);
    });
  });

  describe('Immutability', () => {
    test('does not mutate input context', async () => {
      const originalContext = { ...mockContext };
      const dep = inject(() => ({ value: 'test' }));

      await injector.resolve({ myDep: dep }, mockContext);

      // Context should not be mutated (except dependencies which is added)
      expect(mockContext.method).toBe(originalContext.method);
      expect(mockContext.path).toBe(originalContext.path);
      expect(mockContext.correlationId).toBe(originalContext.correlationId);
    });

    test('returns new resolved object each time', async () => {
      const dep = inject(() => ({ value: 'test' }));

      const result1 = await injector.resolve({ myDep: dep }, mockContext);
      const result2 = await injector.resolve({ myDep: dep }, mockContext);

      expect(result1.resolved).not.toBe(result2.resolved);
    });
  });

  describe('Edge Cases', () => {
    test('handles dependency that throws error', async () => {
      const dep = inject(() => {
        throw new Error('Dependency failed');
      });

      await expect(injector.resolve({ myDep: dep }, mockContext)).rejects.toThrow(
        'Dependency failed',
      );
    });

    test('handles async dependency that throws error', async () => {
      const dep = inject(async () => {
        throw new Error('Async dependency failed');
      });

      await expect(injector.resolve({ myDep: dep }, mockContext)).rejects.toThrow(
        'Async dependency failed',
      );
    });

    test('handles cleanup that throws error', async () => {
      const dep = inject(() => ({ value: 'test' }), {
        cleanup: () => {
          throw new Error('Cleanup failed');
        },
      });

      const { cleanup } = await injector.resolve({ myDep: dep }, mockContext);

      // Cleanup error should propagate
      await expect(cleanup()).rejects.toThrow('Cleanup failed');
    });

    test('handles multiple singletons with same name', async () => {
      const dep = inject(() => ({ count: Math.random() }), { scope: 'singleton' });

      const result1 = await injector.resolve({ sameName: dep }, mockContext);
      const result2 = await injector.resolve({ sameName: dep }, mockContext);

      // Should be the same instance
      expect(result1.resolved.sameName).toBe(result2.resolved.sameName);
    });
  });
});

