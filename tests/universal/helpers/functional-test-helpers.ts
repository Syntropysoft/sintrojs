/**
 * Helpers funcionales para tests
 * Principios: SOLID, DDD, Programación Funcional, Guard Clauses
 *
 * SOLID:
 * - S: Single Responsibility - Cada función tiene una responsabilidad específica
 * - O: Open/Closed - Extensible sin modificar código existente
 * - L: Liskov Substitution - Interfaces consistentes
 * - I: Interface Segregation - Interfaces específicas y pequeñas
 * - D: Dependency Inversion - Dependencias inyectadas
 *
 * DDD:
 * - Domain: TestServer, TestResponse como entidades de dominio
 * - Value Objects: TestData, TestContext inmutables
 * - Services: TestService para operaciones complejas
 *
 * Funcional:
 * - Pure Functions: Sin efectos secundarios
 * - Immutability: Datos inmutables
 * - Composition: Composición de funciones
 * - Higher-Order Functions: Funciones que retornan funciones
 */

import { ErrorHandler } from '../../../src/application/ErrorHandler';
import { RouteRegistry } from '../../../src/application/RouteRegistry';
import { TinyApi } from '../../../src/core/TinyApi';

// ===== DOMAIN ENTITIES (DDD) =====

/**
 * TestServer - Entidad de dominio para servidor de test
 * Principio: Inmutabilidad total
 */
export interface TestServer {
  readonly app: TinyApi;
  readonly url: string;
  readonly port: string;
}

/**
 * TestResponse - Value Object para respuesta de test
 * Principio: Inmutabilidad y encapsulación
 */
export interface TestResponse<T = any> {
  readonly status: number;
  readonly data: T;
  readonly headers: Readonly<Record<string, string>>;
}

/**
 * TestContext - Value Object para contexto de test
 * Principio: Inmutabilidad y validación
 */
export interface TestContext {
  readonly method: string;
  readonly path: string;
  readonly params: Readonly<Record<string, any>>;
  readonly query: Readonly<Record<string, any>>;
  readonly body: Readonly<Record<string, any>>;
  readonly headers: Readonly<Record<string, string>>;
  readonly cookies: Readonly<Record<string, string>>;
  readonly correlationId: string;
  readonly timestamp: Date;
  readonly dependencies: Readonly<Record<string, any>>;
}

/**
 * TestRoute - Value Object para ruta de test
 * Principio: Inmutabilidad y validación
 */
export interface TestRoute {
  readonly path: string;
  readonly handler: Function;
}

// ===== GUARD CLAUSES =====

/**
 * Guard Clause: Validar que el servidor no sea null/undefined
 */
const guardServer = (server: TestServer | null | undefined): TestServer => {
  if (!server) {
    throw new Error('TestServer is required and cannot be null or undefined');
  }
  return server;
};

/**
 * Guard Clause: Validar que la app no sea null/undefined
 */
const guardApp = (app: TinyApi | null | undefined): TinyApi => {
  if (!app) {
    throw new Error('TinyApi is required and cannot be null or undefined');
  }
  return app;
};

/**
 * Guard Clause: Validar que el path sea válido
 */
const guardPath = (path: string | null | undefined): string => {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    throw new Error('Path is required and must be a non-empty string');
  }
  return path;
};

/**
 * Guard Clause: Validar que el puerto sea válido
 */
const guardPort = (port: number): number => {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('Port must be a valid integer between 0 and 65535');
  }
  return port;
};

// ===== PURE FUNCTIONS (Funcional) =====

/**
 * Pure Function: Crear datos de test inmutables
 * Principio: Inmutabilidad total, sin efectos secundarios
 */
export const createTestData = <T>(data: T): Readonly<T> => {
  // Guard Clause
  if (data === null || data === undefined) {
    throw new Error('Data cannot be null or undefined');
  }

  return Object.freeze({ ...data });
};

/**
 * Pure Function: Crear contexto de test inmutable
 * Principio: Inmutabilidad, validación, composición
 */
export const createTestContext = (overrides: Partial<TestContext> = {}): TestContext => {
  const baseContext: TestContext = {
    method: 'GET',
    path: '/test',
    params: Object.freeze({}),
    query: Object.freeze({}),
    body: Object.freeze({}),
    headers: Object.freeze({}),
    cookies: Object.freeze({}),
    correlationId: 'test-123',
    timestamp: new Date(),
    dependencies: Object.freeze({}),
  };

  return Object.freeze({
    ...baseContext,
    ...overrides,
    // Asegurar inmutabilidad de objetos anidados
    params: Object.freeze(overrides.params || baseContext.params),
    query: Object.freeze(overrides.query || baseContext.query),
    body: Object.freeze(overrides.body || baseContext.body),
    headers: Object.freeze(overrides.headers || baseContext.headers),
    cookies: Object.freeze(overrides.cookies || baseContext.cookies),
    dependencies: Object.freeze(overrides.dependencies || baseContext.dependencies),
  });
};

/**
 * Pure Function: Crear ruta de test inmutable
 * Principio: Inmutabilidad, validación
 */
export const createTestRoute = (path: string, handler: Function): TestRoute => {
  // Guard Clauses
  guardPath(path);

  if (!handler || typeof handler !== 'function') {
    throw new Error('Handler must be a valid function');
  }

  return Object.freeze({
    path,
    handler,
  });
};

/**
 * Pure Function: Crear múltiples rutas inmutables
 * Principio: Composición funcional, inmutabilidad
 */
export const createTestRoutes = (
  routes: Array<{ path: string; handler: Function }>,
): ReadonlyArray<TestRoute> => {
  // Guard Clause
  if (!Array.isArray(routes)) {
    throw new Error('Routes must be an array');
  }

  return Object.freeze(routes.map((route) => createTestRoute(route.path, route.handler)));
};

// ===== HIGHER-ORDER FUNCTIONS (Funcional) =====

/**
 * Higher-Order Function: Crear app limpia
 * Principio: Función pura, sin efectos secundarios
 */
export const createTestApp = (): TinyApi => {
  // Limpiar estado global antes de cada test
  RouteRegistry.clear();
  ErrorHandler.clearCustomHandlers();
  return new TinyApi();
};

/**
 * Higher-Order Function: Crear servidor de test
 * Principio: Función pura, composición
 */
export const createTestServer = async (app: TinyApi, port = 0): Promise<TestServer> => {
  // Guard Clauses
  guardApp(app);
  guardPort(port);

  const url = await app.listen(port);
  const portNumber = new URL(url).port;

  return Object.freeze({
    app,
    url,
    port: portNumber,
  });
};

/**
 * Higher-Order Function: Hacer request HTTP
 * Principio: Función pura, composición, inmutabilidad
 */
export const makeRequest = async <T = any>(
  server: TestServer,
  path: string,
  options: RequestInit = {},
): Promise<TestResponse<T>> => {
  // Guard Clauses
  guardServer(server);
  guardPath(path);

  const url = `http://localhost:${server.port}${path}`;
  const response = await fetch(url, options);
  const data = await response.json();

  return Object.freeze({
    status: response.status,
    data,
    headers: Object.freeze(Object.fromEntries(response.headers.entries())),
  });
};

/**
 * Higher-Order Function: Cleanup de servidor
 * Principio: Función pura, manejo de errores funcional
 */
export const cleanupServer = async (server: TestServer): Promise<void> => {
  // Guard Clause
  guardServer(server);

  try {
    await server.app.close();
  } catch {
    // Ignorar errores de cleanup - principio funcional de no propagar errores de cleanup
  }
};

/**
 * Higher-Order Function: Verificar respuesta
 * Principio: Función pura, validación funcional
 */
export const expectResponse = <T>(
  response: TestResponse<T>,
  expectedStatus: number,
  expectedData?: T,
): void => {
  // Guard Clauses
  if (!response) {
    throw new Error('Response is required');
  }

  if (!Number.isInteger(expectedStatus) || expectedStatus < 100 || expectedStatus > 599) {
    throw new Error('Expected status must be a valid HTTP status code');
  }

  expect(response.status).toBe(expectedStatus);
  if (expectedData !== undefined) {
    expect(response.data).toEqual(expectedData);
  }
};

// ===== COMPOSITION FUNCTIONS (Funcional) =====

/**
 * Composition Function: Setup de test con servidor
 * Principio: Composición funcional, manejo de recursos
 */
export const withTestServer = async <T>(
  app: TinyApi,
  testFn: (server: TestServer) => Promise<T>,
): Promise<T> => {
  // Guard Clauses
  guardApp(app);

  if (!testFn || typeof testFn !== 'function') {
    throw new Error('Test function is required and must be a function');
  }

  const server = await createTestServer(app);
  try {
    return await testFn(server);
  } finally {
    await cleanupServer(server);
  }
};

/**
 * Composition Function: Setup de test sin servidor
 * Principio: Composición funcional, inmutabilidad
 */
export const withTestApp = <T>(testFn: (app: TinyApi) => T): T => {
  // Guard Clause
  if (!testFn || typeof testFn !== 'function') {
    throw new Error('Test function is required and must be a function');
  }

  const app = createTestApp();
  return testFn(app);
};

// ===== SERVICE LAYER (DDD) =====

/**
 * TestService - Servicio de dominio para operaciones de test
 * Principio: Single Responsibility, Dependency Inversion
 */
export class TestService {
  /**
   * Crear suite de tests funcional
   * Principio: Composición funcional
   */
  static createTestSuite =
    <T>(
      setup: () => Promise<T>,
      teardown: (context: T) => Promise<void>,
      tests: (context: T) => Promise<void>,
    ) =>
    async (): Promise<void> => {
      // Guard Clauses
      if (!setup || typeof setup !== 'function') {
        throw new Error('Setup function is required');
      }
      if (!teardown || typeof teardown !== 'function') {
        throw new Error('Teardown function is required');
      }
      if (!tests || typeof tests !== 'function') {
        throw new Error('Tests function is required');
      }

      const context = await setup();
      try {
        await tests(context);
      } finally {
        await teardown(context);
      }
    };

  /**
   * Crear test de integración funcional
   * Principio: Composición funcional
   */
  static createIntegrationTest =
    <T>(testFn: (server: TestServer) => Promise<T>) =>
    async (): Promise<T> => {
      return withTestServer(createTestApp(), testFn);
    };
}
