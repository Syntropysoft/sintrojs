/**
 * TinyApi - Core Facade
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
import type { ExceptionHandler, HttpMethod, RouteConfig } from '../domain/types';
import { FastifyAdapter } from '../infrastructure/FastifyAdapter';

/**
 * TinyApi configuration
 */
export interface TinyApiConfig {
  /** API title for OpenAPI docs */
  title?: string;

  /** API version */
  version?: string;

  /** API description */
  description?: string;

  /** Enable logger */
  logger?: boolean;
}

/**
 * TinyApi main class
 * Facade that orchestrates all framework layers
 */
export class TinyApi {
  private readonly config: TinyApiConfig;
  private readonly fastify: FastifyInstance;
  private isStarted = false;

  constructor(config: TinyApiConfig = {}) {
    this.config = config;

    // Create Fastify instance via adapter
    this.fastify = FastifyAdapter.create({
      logger: config.logger ?? false,
    });

    // Register OpenAPI endpoint
    this.registerOpenAPIEndpoint();
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

    return address;
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
      FastifyAdapter.registerRoute(this.fastify, route);
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
}
