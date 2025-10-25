/**
 * Test funcional para middleware system
 * Principios: SOLID, DDD, Programación Funcional, Guard Clauses
 */

import { describe, expect, it } from 'vitest';
import { MiddlewareRegistry } from '../../../src/application/MiddlewareRegistry';
import { SyntroJS } from '../../../src/core/TinyApi';

// ===== GUARD CLAUSES =====

/**
 * Guard Clause: Validar que la app no sea null/undefined
 */
const guardApp = (app: SyntroJS | null | undefined): SyntroJS => {
  if (!app) {
    throw new Error('SyntroJS app is required and cannot be null or undefined');
  }
  return app;
};

/**
 * Guard Clause: Validar que el registry no sea null/undefined
 */
const guardRegistry = (registry: MiddlewareRegistry | null | undefined): MiddlewareRegistry => {
  if (!registry) {
    throw new Error('MiddlewareRegistry is required and cannot be null or undefined');
  }
  return registry;
};

// ===== PURE FUNCTIONS (Funcional) =====

/**
 * Pure Function: Crear app limpia
 * Principio: Función pura, sin efectos secundarios
 */
const createApp = (): SyntroJS => {
  return new SyntroJS();
};

/**
 * Pure Function: Crear middleware puro
 * Principio: Inmutabilidad total, sin efectos secundarios
 */
const createPureMiddleware = (name: string) => async (ctx: any) => {
  // Sin efectos secundarios - solo retorna datos
  return { middleware: name, path: ctx.path };
};

/**
 * Pure Function: Verificar registro funcionalmente
 * Principio: Composición funcional, validación
 */
const verifyRegistry = (app: SyntroJS, expectedCount: number): void => {
  // Guard Clauses
  guardApp(app);

  if (!Number.isInteger(expectedCount) || expectedCount < 0) {
    throw new Error('Expected count must be a non-negative integer');
  }

  const registry = app.getMiddlewareRegistry();
  guardRegistry(registry);

  expect(registry).toBeInstanceOf(MiddlewareRegistry);
  expect(registry.getCount()).toBe(expectedCount);
};

/**
 * Pure Function: Crear configuración de middleware inmutable
 * Principio: Inmutabilidad, validación
 */
const createMiddlewareConfig = (overrides: any = {}) => {
  return Object.freeze({
    priority: 100,
    ...overrides,
  });
};

// ===== COMPOSITION FUNCTIONS (Funcional) =====

/**
 * Composition Function: Test de middleware básico
 * Principio: Composición funcional
 */
const testBasicMiddleware = (app: SyntroJS, middlewareName: string): SyntroJS => {
  const middleware = createPureMiddleware(middlewareName);
  return app.use(middleware);
};

/**
 * Composition Function: Test de middleware con path específico
 * Principio: Composición funcional
 */
const testPathSpecificMiddleware = (
  app: SyntroJS,
  path: string,
  middlewareName: string,
): SyntroJS => {
  const middleware = createPureMiddleware(middlewareName);
  return app.use(path, middleware);
};

/**
 * Composition Function: Test de middleware con configuración
 * Principio: Composición funcional
 */
const testConfiguredMiddleware = (
  app: SyntroJS,
  path: string,
  middlewareName: string,
  config: any,
): SyntroJS => {
  const middleware = createPureMiddleware(middlewareName);
  return app.use(path, middleware, config);
};

describe('Middleware System', () => {
  it('should create SyntroJS with middleware support', () => {
    const app = createApp();
    expect(app).toBeDefined();
    verifyRegistry(app, 0);
  });

  it('should register middleware functionally', () => {
    const app = createApp();
    const result = testBasicMiddleware(app, 'test');

    expect(result).toBe(app); // Chaining funcional
    verifyRegistry(app, 1);
  });

  it('should register path-specific middleware functionally', () => {
    const app = createApp();
    const result = testPathSpecificMiddleware(app, '/api', 'api');

    expect(result).toBe(app); // Chaining funcional
    verifyRegistry(app, 1);
  });

  it('should register method-specific middleware functionally', () => {
    const app = createApp();
    const config = createMiddlewareConfig({ method: 'POST' });
    const result = testConfiguredMiddleware(app, '/users', 'user', config);

    expect(result).toBe(app); // Chaining funcional
    verifyRegistry(app, 1);
  });

  it('should support functional composition', () => {
    const app = createApp();
    const authMiddleware = createPureMiddleware('auth');
    const loggingMiddleware = createPureMiddleware('logging');

    // Composición funcional
    const result = app.use(authMiddleware).use(loggingMiddleware);

    expect(result).toBe(app);
    verifyRegistry(app, 2);
  });

  it('should maintain immutability in registry operations', () => {
    const app = createApp();
    const middleware = createPureMiddleware('test');

    const registry1 = app.getMiddlewareRegistry();
    const registry2 = app.use(middleware).getMiddlewareRegistry();

    // Los registries deben ser diferentes instancias (inmutabilidad)
    expect(registry1).not.toBe(registry2);
    expect(registry1.getCount()).toBe(0);
    expect(registry2.getCount()).toBe(1);
  });

  it('should support functional filtering and sorting', () => {
    const app = createApp();

    // Crear middlewares con diferentes prioridades
    const highPriorityMiddleware = createPureMiddleware('high');
    const lowPriorityMiddleware = createPureMiddleware('low');

    app.use(highPriorityMiddleware, createMiddlewareConfig({ priority: 10 }));
    app.use(lowPriorityMiddleware, createMiddlewareConfig({ priority: 200 }));

    const registry = app.getMiddlewareRegistry();
    const middlewares = registry.getMiddlewares('/test', 'GET');

    // Debe estar ordenado por prioridad (menor número = mayor prioridad)
    expect(middlewares).toHaveLength(2);
    // El primer middleware debe ser el de alta prioridad
    expect(middlewares[0]).toBe(highPriorityMiddleware);
  });

  it('should handle guard clauses properly', () => {
    const app = createApp();

    // Test guard clauses - Principio: Guard Clauses en SyntroJS
    expect(() => app.use(null as any)).toThrow('Middleware or path is required');
    expect(() => app.use('' as any, createPureMiddleware('test'))).toThrow(
      'Middleware or path is required',
    );
  });
});
