/**
 * SyntroJS - Core Facade
 *
 * Responsibility: Public API and orchestration of all layers
 * Pattern: Facade Pattern
 * Principles: SOLID, DDD, Guard Clauses, Clean API
 */

import type { FastifyInstance } from 'fastify';
import { DocsRenderer } from '../application/DocsRenderer';
import { ErrorHandler } from '../application/ErrorHandler';
import { OpenAPIGenerator } from '../application/OpenAPIGenerator';
import type { OpenAPIConfig } from '../application/OpenAPIGenerator';
import { RouteRegistry } from '../application/RouteRegistry';
import { Route } from '../domain/Route';
import type { ExceptionHandler, HttpMethod, RouteConfig, Middleware, MiddlewareConfig, WebSocketHandler } from '../domain/types';
import { BunAdapter } from '../infrastructure/BunAdapter';
import { FastifyAdapter } from '../infrastructure/FastifyAdapter';
import { FluentAdapter } from '../infrastructure/FluentAdapter';
import { RuntimeOptimizer } from '../infrastructure/RuntimeOptimizer';
import { UltraFastAdapter } from '../infrastructure/UltraFastAdapter';
import { MiddlewareRegistry } from '../application/MiddlewareRegistry';
import { WebSocketRegistry } from '../application/WebSocketRegistry';
import { UltraFastifyAdapter } from '../infrastructure/UltraFastifyAdapter';
import { UltraMinimalAdapter } from '../infrastructure/UltraMinimalAdapter';

/**
 * Route definition for object-based API
 */
export interface RouteDefinition {
  [path: string]: {
    get?: RouteConfig<unknown, unknown, unknown, unknown>;
    post?: RouteConfig<unknown, unknown, unknown, unknown>;
    put?: RouteConfig<unknown, unknown, unknown, unknown>;
    delete?: RouteConfig<unknown, unknown, unknown, unknown>;
    patch?: RouteConfig<unknown, unknown, unknown, unknown>;
  };
}

/**
 * SyntroJS configuration
 */
export interface SyntroJSConfig {
  /** API title for OpenAPI docs */
  title?: string;

  /** API version */
  version?: string;

  /** API description */
  description?: string;

  /** Enable logger */
  logger?: boolean;

  /** Routes defined as object (alternative to method chaining) */
  routes?: RouteDefinition;

  /** Use ultra-optimized adapter for maximum performance */
  ultraOptimized?: boolean;

  /** Use ultra-minimal adapter for absolute maximum performance */
  ultraMinimal?: boolean;

  /** Use ultra-fast adapter for maximum performance with features */
  ultraFast?: boolean;

  /** Use fluent adapter for dynamic tree shaking */
  fluent?: boolean;

  /** Fluent adapter configuration */
  fluentConfig?: {
    logger?: boolean;
    validation?: boolean;
    errorHandling?: boolean;
    dependencyInjection?: boolean;
    backgroundTasks?: boolean;
    openAPI?: boolean;
    compression?: boolean;
    cors?: boolean;
    helmet?: boolean;
    rateLimit?: boolean;
    middleware?: boolean;
  };

  /** Runtime to use: 'auto', 'node', or 'bun' */
  runtime?: 'auto' | 'node' | 'bun';
}

/**
 * SyntroJS main class
 * Facade that orchestrates all framework layers
 * 
 * Principles Applied:
 * - SOLID: Single Responsibility, Open/Closed, Dependency Inversion
 * - DDD: Domain Services, Value Objects, Aggregates
 * - Functional: Pure functions, Immutability, Composition
 * - Guard Clauses: Early validation, Fail Fast
 */
export class SyntroJS {
  private readonly config: SyntroJSConfig;
  private readonly fastify: FastifyInstance;
  private readonly adapter:
    | typeof FastifyAdapter
    | typeof UltraFastAdapter
    | typeof UltraFastifyAdapter
    | typeof UltraMinimalAdapter
    | typeof BunAdapter
    | typeof FluentAdapter;
  private readonly runtime: 'node' | 'bun';
  private readonly optimizer: RuntimeOptimizer;
  private middlewareRegistry: MiddlewareRegistry;
  private websocketRegistry: WebSocketRegistry;
  private isStarted = false;

  constructor(config: SyntroJSConfig = {}) {
    // Guard clause: validate config
    const validatedConfig = this.validateConfig(config);
    
    // Initialize immutable configuration
    this.config = Object.freeze({
      runtime: 'auto',
      ...validatedConfig,
    });

    // Initialize domain services (DDD)
    this.optimizer = new RuntimeOptimizer();
    this.middlewareRegistry = new MiddlewareRegistry();
    this.websocketRegistry = new WebSocketRegistry();

    // Auto-detect runtime (pure function)
    this.runtime = this.detectRuntime();

    // Choose adapter based on runtime and config (pure function)
    this.adapter = this.selectOptimalAdapter();

    // Create Fastify instance via adapter (composition)
    this.fastify = this.createFastifyInstance();

    // Register OpenAPI endpoint
    this.registerOpenAPIEndpoint();

    // Register routes from config if provided
    if (this.config.routes) {
      this.registerRoutesFromConfig(this.config.routes);
    }
  }

  /**
   * Guard clause: Validate configuration
   * 
   * @param config - Configuration to validate
   * @returns Validated configuration
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: SyntroJSConfig): SyntroJSConfig {
    // Guard clause: config must be an object
    if (!config || typeof config !== 'object') {
      throw new Error('Configuration must be a valid object');
    }

    // Guard clause: validate runtime if provided
    if (config.runtime && !['auto', 'node', 'bun'].includes(config.runtime)) {
      throw new Error('Runtime must be "auto", "node", or "bun"');
    }

    // Guard clause: validate fluentConfig if provided
    if (config.fluentConfig && typeof config.fluentConfig !== 'object') {
      throw new Error('fluentConfig must be a valid object');
    }

    // Return validated config (immutable)
    return Object.freeze({ ...config });
  }

  /**
   * Create Fastify instance using composition pattern
   * 
   * @returns Configured Fastify instance
   */
  private createFastifyInstance(): FastifyInstance {
    if (this.adapter === FluentAdapter) {
      return this.createFluentAdapter();
    }
    
    return this.adapter.create() as FastifyInstance;
  }

  /**
   * Create FluentAdapter with configuration
   * 
   * @returns Configured FluentAdapter instance
   */
  private createFluentAdapter(): FastifyInstance {
    const fluentAdapter = new FluentAdapter();
    
    // Apply fluent configuration using functional composition
    const configuredAdapter = this.applyFluentConfig(fluentAdapter);
    
    // Configure middleware registry
    configuredAdapter.withMiddlewareRegistry(this.middlewareRegistry);
    
    return configuredAdapter.create();
  }

  /**
   * Apply fluent configuration using functional composition
   * 
   * @param adapter - FluentAdapter instance
   * @returns Configured adapter
   */
  private applyFluentConfig(adapter: FluentAdapter): FluentAdapter {
    const fluentConfig = this.config.fluentConfig;
    
    if (!fluentConfig) {
      return adapter.standard();
    }

    // Apply configuration using functional composition
    return Object.entries(fluentConfig).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        const methodName = `with${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof FluentAdapter;
        if (typeof acc[methodName] === 'function') {
          return (acc[methodName] as (value: boolean) => FluentAdapter)(value);
        }
      }
      return acc;
    }, adapter);
  }

  /**
   * Auto-detect runtime (Bun or Node.js) - Pure function
   * 
   * @returns Detected runtime
   */
  private detectRuntime(): 'node' | 'bun' {
    // If runtime is explicitly set, use it
    if (this.config.runtime === 'bun') return 'bun';
    if (this.config.runtime === 'node') return 'node';

    // Auto-detect: Check if we're in Bun
    if (typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined') {
      return 'bun';
    }
    return 'node';
  }

  /**
   * Select optimal adapter based on runtime and configuration
   */
  private selectOptimalAdapter():
    | typeof FastifyAdapter
    | typeof UltraFastAdapter
    | typeof UltraFastifyAdapter
    | typeof UltraMinimalAdapter
    | typeof BunAdapter
    | typeof FluentAdapter {
    // Force specific adapter if configured
    if (this.config.fluent) return FluentAdapter;
    if (this.config.ultraMinimal) return UltraMinimalAdapter;
    if (this.config.ultraFast) return UltraFastAdapter;
    if (this.config.ultraOptimized) return UltraFastifyAdapter;

    // Runtime-specific optimal adapter selection
    if (this.runtime === 'bun') {
      // Use BunAdapter for maximum Bun performance
      return BunAdapter;
    }

    // Node.js: Use FluentAdapter as default (tree shaking enabled)
    return FluentAdapter;
  }

  /**
   * Registers a GET route
   *
   * @param path - Route path
   * @param config - Route configuration
   * @returns this (for chaining)
   */
  get<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('GET', path, config);
  }

  /**
   * Registers a POST route
   *
   * @param path - Route path
   * @param config - Route configuration
   * @returns this (for chaining)
   */
  post<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('POST', path, config);
  }

  /**
   * Registers a PUT route
   *
   * @param path - Route path
   * @param config - Route configuration
   * @returns this (for chaining)
   */
  put<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('PUT', path, config);
  }

  /**
   * Registers a DELETE route
   *
   * @param path - Route path
   * @param config - Route configuration
   * @returns this (for chaining)
   */
  delete<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('DELETE', path, config);
  }

  /**
   * Registers a PATCH route
   *
   * @param path - Route path
   * @param config - Route configuration
   * @returns this (for chaining)
   */
  patch<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('PATCH', path, config);
  }

  /**
   * Sets the API title for OpenAPI documentation
   *
   * @param title - API title
   * @returns this (for chaining)
   */
  title(title: string): this {
    // Guard clause
    if (!title) {
      throw new Error('Title is required');
    }

    this.config.title = title;
    return this;
  }

  /**
   * Sets the API version for OpenAPI documentation
   *
   * @param version - API version
   * @returns this (for chaining)
   */
  version(version: string): this {
    // Guard clause
    if (!version) {
      throw new Error('Version is required');
    }

    this.config.version = version;
    return this;
  }

  /**
   * Sets the API description for OpenAPI documentation
   *
   * @param description - API description
   * @returns this (for chaining)
   */
  description(description: string): this {
    // Guard clause
    if (!description) {
      throw new Error('Description is required');
    }

    this.config.description = description;
    return this;
  }

  /**
   * Enables or disables logging
   *
   * @param enabled - Whether to enable logging
   * @returns this (for chaining)
   */
  logging(enabled: boolean): this {
    this.config.logger = enabled;
    return this;
  }

  /**
   * Registers a custom exception handler
   *
   * @param errorClass - Error class to handle
   * @param handler - Handler function
   * @returns this (for chaining)
   */
  exceptionHandler<E extends Error>(
    errorClass: new (...args: unknown[]) => E,
    handler: ExceptionHandler<E>,
  ): this {
    // Guard clauses
    if (!errorClass) {
      throw new Error('Error class is required');
    }

    if (!handler) {
      throw new Error('Handler function is required');
    }

    // Register with ErrorHandler service
    ErrorHandler.register(errorClass, handler);

    return this;
  }

  /**
   * Starts the server
   *
   * @param port - Port to listen on
   * @param host - Host to bind to
   * @returns Server address
   */
  async listen(port: number, host = '::'): Promise<string> {
    // Guard clauses
    if (port < 0 || port > 65535) {
      throw new Error('Valid port number is required (0-65535)');
    }

    if (this.isStarted) {
      throw new Error('Server is already started');
    }

    // Register all routes with Fastify
    this.registerAllRoutes();

    // Start server via adapter
    const address = await FastifyAdapter.listen(this.fastify, port, host);

    this.isStarted = true;

    // Show runtime information
    this.showRuntimeInfo(address);

    return address;
  }

  /**
   * Show runtime information
   */
  private showRuntimeInfo(address: string): void {
    // Use RuntimeOptimizer for detailed runtime information
    this.optimizer.logRuntimeInfo();

    console.log(`Server running at ${address}\n`);
    console.log('📖 Interactive Documentation:');
    console.log(`   Swagger UI: ${address}/docs`);
    console.log(`   ReDoc:      ${address}/redoc\n`);
    console.log('🔗 Available Endpoints:');
    console.log(`   GET    ${address}/hello\n`);
    console.log('💡 Try this example:');
    console.log(`   curl ${address}/hello\n`);
  }

  /**
   * Stops the server
   */
  async close(): Promise<void> {
    // Guard clause
    if (!this.isStarted) {
      throw new Error('Server is not started');
    }

    await FastifyAdapter.close(this.fastify);

    this.isStarted = false;
  }

  /**
   * Gets the underlying Fastify instance
   * Use with caution - breaks abstraction
   *
   * @returns Fastify instance
   */
  getRawFastify(): FastifyInstance {
    return this.fastify;
  }

  /**
   * Registers a route internally
   *
   * @param method - HTTP method
   * @param path - Route path
   * @param config - Route configuration
   * @returns this (for chaining)
   */
  private registerRoute<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    method: HttpMethod,
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    // Guard clauses
    if (!method) {
      throw new Error('Method is required');
    }

    if (!path) {
      throw new Error('Path is required');
    }

    if (!config) {
      throw new Error('Config is required');
    }

    // Create route entity
    const route = new Route(method, path, config);

    // Register with RouteRegistry
    RouteRegistry.register(
      route as Route<unknown, unknown, unknown, unknown, Record<string, unknown>>,
    );

    return this;
  }

  /**
   * Registers all routes from RouteRegistry with Fastify
   */
  private registerAllRoutes(): void {
    const routes = RouteRegistry.getAll();

    // Functional: forEach for side effects (registration)
    for (const route of routes) {
      this.adapter.registerRoute(this.fastify, route);
    }
  }

  /**
   * Registers OpenAPI and docs endpoints
   */
  private registerOpenAPIEndpoint(): void {
    // OpenAPI JSON spec
    this.fastify.get('/openapi.json', async () => {
      return this.getOpenAPISpec();
    });

    // Swagger UI
    this.fastify.get('/docs', async (_request, reply) => {
      const html = DocsRenderer.renderSwaggerUI({
        openApiUrl: '/openapi.json',
        title: this.config.title,
      });

      return reply.type('text/html').send(html);
    });

    // ReDoc
    this.fastify.get('/redoc', async (_request, reply) => {
      const html = DocsRenderer.renderReDoc({
        openApiUrl: '/openapi.json',
        title: this.config.title,
      });

      return reply.type('text/html').send(html);
    });
  }

  /**
   * Gets OpenAPI specification
   *
   * @returns OpenAPI 3.1 spec
   */
  getOpenAPISpec() {
    const routes = RouteRegistry.getAll();

    const openApiConfig: OpenAPIConfig = {
      title: this.config.title ?? 'TinyApi Application',
      version: this.config.version ?? '1.0.0',
      description: this.config.description,
    };

    return OpenAPIGenerator.generate(routes, openApiConfig);
  }

  /**
   * Registers routes from configuration object
   *
   * @param routes - Routes definition object
   */
  private registerRoutesFromConfig(routes: RouteDefinition): void {
    // Guard clause
    if (!routes) {
      throw new Error('Routes configuration is required');
    }

    // Iterate through each path and its methods
    for (const [path, methods] of Object.entries(routes)) {
      // Guard clause
      if (!path) {
        throw new Error('Route path cannot be empty');
      }

      if (!methods) {
        throw new Error(`Route methods for path '${path}' are required`);
      }

      // Register each HTTP method for this path
      for (const [method, config] of Object.entries(methods)) {
        // Guard clause
        if (!config) {
          continue; // Skip undefined methods
        }

        // Validate method is supported
        const httpMethod = method.toUpperCase() as HttpMethod;
        if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(httpMethod)) {
          throw new Error(`Unsupported HTTP method: ${method}`);
        }

        // Register the route
        this.registerRoute(httpMethod, path, config);
      }
    }
  }

  /**
   * Add middleware - simple functional API
   * Principio: Inmutabilidad funcional - actualiza referencia interna
   */
  use(middleware: Middleware): this;
  use(middleware: Middleware, config: MiddlewareConfig): this;
  use(path: string, middleware: Middleware): this;
  use(path: string, middleware: Middleware, config: MiddlewareConfig): this;
  use(
    middlewareOrPath: Middleware | string,
    middlewareOrConfig?: Middleware | MiddlewareConfig,
    config?: MiddlewareConfig,
  ): this {
    // Guard Clause: Validar parámetros
    if (!middlewareOrPath) {
      throw new Error('Middleware or path is required');
    }

    // Actualizar referencia interna con nueva instancia inmutable
    this.middlewareRegistry = this.middlewareRegistry.add(
      middlewareOrPath as any,
      middlewareOrConfig as any,
      config as any,
    );
    return this;
  }

  /**
   * Get middleware registry (for internal use)
   */
  getMiddlewareRegistry(): MiddlewareRegistry {
    return this.middlewareRegistry;
  }

  /**
   * Add WebSocket handler - simple functional API
   * Principio: Inmutabilidad funcional - actualiza referencia interna
   */
  ws(path: string, handler: WebSocketHandler): this {
    // Guard Clause: Validar parámetros
    if (!path || typeof path !== 'string') {
      throw new Error('Path is required and must be a valid string');
    }
    if (!handler || typeof handler !== 'function') {
      throw new Error('Handler is required and must be a valid function');
    }

    // Actualizar referencia interna con nueva instancia inmutable
    this.websocketRegistry = this.websocketRegistry.add(path, handler);
    return this;
  }

  /**
   * Get websocket registry (for internal use)
   */
  getWebSocketRegistry(): WebSocketRegistry {
    return this.websocketRegistry;
  }
}

// Alias para compatibilidad hacia atrás
export const TinyApi = SyntroJS;
export type TinyApiConfig = SyntroJSConfig;
