import type { Middleware, MiddlewareConfig, MiddlewareEntry, RequestContext, HttpMethod } from '../domain/types';

// ===== GUARD CLAUSES =====

/**
 * Guard Clause: Validar middleware
 */
const guardMiddleware = (middleware: Middleware | null | undefined): Middleware => {
  if (!middleware || typeof middleware !== 'function') {
    throw new Error('Middleware must be a valid function');
  }
  return middleware;
};

/**
 * Guard Clause: Validar path
 */
const guardPath = (path: string | null | undefined): string | undefined => {
  if (path !== undefined && (!path || typeof path !== 'string')) {
    throw new Error('Path must be a valid string or undefined');
  }
  return path;
};

/**
 * Guard Clause: Validar method
 */
const guardMethod = (method: HttpMethod | null | undefined): HttpMethod | undefined => {
  if (method !== undefined && !method) {
    throw new Error('Method must be a valid HttpMethod or undefined');
  }
  return method;
};

/**
 * Guard Clause: Validar priority
 */
const guardPriority = (priority: number | null | undefined): number => {
  if (priority !== undefined && priority !== null && (!Number.isInteger(priority) || priority < 0)) {
    throw new Error('Priority must be a non-negative integer');
  }
  return priority ?? 100;
};

/**
 * Guard Clause: Validar context
 */
const guardContext = (context: RequestContext | null | undefined): RequestContext => {
  if (!context) {
    throw new Error('RequestContext is required');
  }
  return context;
};

// ===== PURE FUNCTIONS (Funcional) =====

/**
 * Pure Function: Crear configuración de middleware inmutable
 * Principio: Inmutabilidad, validación
 */
const createMiddlewareConfig = (config: Partial<MiddlewareConfig> = {}): MiddlewareConfig => {
  return Object.freeze({
    path: guardPath(config.path),
    method: guardMethod(config.method),
    priority: guardPriority(config.priority),
  });
};

/**
 * Pure Function: Crear entrada de middleware inmutable
 * Principio: Inmutabilidad, validación
 */
const createMiddlewareEntry = (
  middleware: Middleware,
  config: MiddlewareConfig,
  id: string
): MiddlewareEntry => {
  guardMiddleware(middleware);
  
  if (!id || typeof id !== 'string') {
    throw new Error('ID must be a valid string');
  }

  return Object.freeze({
    middleware,
    config,
    id,
  });
};

/**
 * Pure Function: Verificar si path coincide con patrón
 * Principio: Función pura, sin efectos secundarios
 */
const matchesPath = (pattern: string | undefined, path: string): boolean => {
  // Guard Clause
  if (!path || typeof path !== 'string') {
    return false;
  }

  if (!pattern) return true; // Global middleware

  // Simple pattern matching funcional
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return path.startsWith(prefix);
  }

  return path === pattern || path.startsWith(pattern + '/');
};

/**
 * Pure Function: Verificar si method coincide
 * Principio: Función pura, sin efectos secundarios
 */
const matchesMethod = (pattern: HttpMethod | undefined, method: HttpMethod): boolean => {
  if (!pattern) return true; // All methods
  return pattern === method;
};

/**
 * Pure Function: Filtrar middlewares por path y method
 * Principio: Composición funcional, inmutabilidad
 */
const filterMiddlewares = (
  middlewares: ReadonlyArray<MiddlewareEntry>,
  path: string,
  method: HttpMethod
): ReadonlyArray<MiddlewareEntry> => {
  return middlewares.filter(entry => 
    matchesPath(entry.config.path, path) && 
    matchesMethod(entry.config.method, method)
  );
};

/**
 * Pure Function: Ordenar middlewares por prioridad
 * Principio: Función pura, inmutabilidad
 */
const sortMiddlewaresByPriority = (
  middlewares: ReadonlyArray<MiddlewareEntry>
): ReadonlyArray<MiddlewareEntry> => {
  return [...middlewares].sort((a, b) => 
    (a.config.priority || 100) - (b.config.priority || 100)
  );
};

/**
 * Pure Function: Extraer solo los middleware functions
 * Principio: Composición funcional
 */
const extractMiddlewareFunctions = (
  entries: ReadonlyArray<MiddlewareEntry>
): ReadonlyArray<Middleware> => {
  return entries.map(entry => entry.middleware);
};

/**
 * MiddlewareRegistry - Registry de middleware con principios SOLID + DDD + Funcional
 * 
 * SOLID:
 * - S: Single Responsibility - Solo maneja registro y ejecución de middleware
 * - O: Open/Closed - Extensible via configuración sin modificar código
 * - L: Liskov Substitution - Implementa interfaces consistentes
 * - I: Interface Segregation - Interfaces específicas para cada operación
 * - D: Dependency Inversion - Depende de abstracciones, no implementaciones
 * 
 * DDD:
 * - Domain Service: MiddlewareRegistry como servicio de dominio
 * - Value Objects: MiddlewareEntry, MiddlewareConfig inmutables
 * - Aggregate: MiddlewareRegistry como agregado raíz
 * 
 * Funcional:
 * - Pure Functions: Métodos sin efectos secundarios
 * - Immutability: Datos inmutables donde sea posible
 * - Composition: Composición de middleware
 * - Higher-Order Functions: Funciones que manejan middleware
 */
export class MiddlewareRegistry {
  private readonly middlewares: ReadonlyArray<MiddlewareEntry> = [];
  private readonly nextId: number = 1;

  /**
   * Constructor funcional - inmutabilidad
   */
  constructor(initialMiddlewares: ReadonlyArray<MiddlewareEntry> = []) {
    this.middlewares = Object.freeze([...initialMiddlewares]);
  }

  /**
   * Add middleware - API funcional con overloads
   * Principio: Single Responsibility, Open/Closed
   */
  add(middleware: Middleware): MiddlewareRegistry;
  add(middleware: Middleware, config: MiddlewareConfig): MiddlewareRegistry;
  add(path: string, middleware: Middleware): MiddlewareRegistry;
  add(path: string, middleware: Middleware, config: MiddlewareConfig): MiddlewareRegistry;
  add(
    middlewareOrPath: Middleware | string,
    middlewareOrConfig?: Middleware | MiddlewareConfig,
    config?: MiddlewareConfig,
  ): MiddlewareRegistry {
    // Guard Clauses
    if (!middlewareOrPath) {
      throw new Error('Middleware or path is required');
    }

    let middleware: Middleware;
    let finalConfig: MiddlewareConfig;

    if (typeof middlewareOrPath === 'string') {
      // app.use('/path', middleware)
      middleware = guardMiddleware(middlewareOrConfig as Middleware);
      finalConfig = createMiddlewareConfig({
        path: middlewareOrPath,
        ...config,
      });
    } else {
      // app.use(middleware) or app.use(middleware, config)
      middleware = guardMiddleware(middlewareOrPath);
      finalConfig = createMiddlewareConfig(middlewareOrConfig as MiddlewareConfig || {});
    }

    const id = `middleware_${this.nextId}`;
    const entry = createMiddlewareEntry(middleware, finalConfig, id);

    // Crear nueva instancia inmutable (principio funcional)
    return new MiddlewareRegistry([...this.middlewares, entry]);
  }

  /**
   * Get middlewares that match path and method - función pura
   * Principio: Single Responsibility, composición funcional
   */
  getMiddlewares(path: string, method: HttpMethod): ReadonlyArray<Middleware> {
    // Guard Clauses
    guardPath(path);
    guardMethod(method);

    const filtered = filterMiddlewares(this.middlewares, path, method);
    const sorted = sortMiddlewaresByPriority(filtered);
    return extractMiddlewareFunctions(sorted);
  }

  /**
   * Execute middlewares in sequence - función pura
   * Principio: Single Responsibility, composición funcional
   */
  async executeMiddlewares(middlewares: ReadonlyArray<Middleware>, context: RequestContext): Promise<void> {
    // Guard Clauses
    guardContext(context);
    
    if (!Array.isArray(middlewares)) {
      throw new Error('Middlewares must be an array');
    }

    // Ejecución funcional - sin efectos secundarios en el registry
    for (const middleware of middlewares) {
      await middleware(context);
    }
  }

  /**
   * Remove middleware by ID - función pura que retorna nueva instancia
   * Principio: Inmutabilidad, composición funcional
   */
  remove(id: string): MiddlewareRegistry {
    // Guard Clause
    if (!id || typeof id !== 'string') {
      throw new Error('ID must be a valid string');
    }

    const filtered = this.middlewares.filter(entry => entry.id !== id);
    return new MiddlewareRegistry(filtered);
  }

  /**
   * Clear all middlewares - función pura que retorna nueva instancia
   * Principio: Inmutabilidad
   */
  clear(): MiddlewareRegistry {
    return new MiddlewareRegistry([]);
  }

  /**
   * Get all middlewares - función pura
   * Principio: Inmutabilidad, encapsulación
   */
  getAll(): ReadonlyArray<MiddlewareEntry> {
    return this.middlewares;
  }

  /**
   * Get count of middlewares - función pura
   * Principio: Single Responsibility
   */
  getCount(): number {
    return this.middlewares.length;
  }

  /**
   * Check if registry is empty - función pura
   * Principio: Single Responsibility
   */
  isEmpty(): boolean {
    return this.middlewares.length === 0;
  }

  /**
   * Find middleware by ID - función pura
   * Principio: Single Responsibility, composición funcional
   */
  findById(id: string): MiddlewareEntry | undefined {
    // Guard Clause
    if (!id || typeof id !== 'string') {
      throw new Error('ID must be a valid string');
    }

    return this.middlewares.find(entry => entry.id === id);
  }

  /**
   * Check if middleware exists by ID - función pura
   * Principio: Single Responsibility
   */
  hasMiddleware(id: string): boolean {
    return this.findById(id) !== undefined;
  }
}
