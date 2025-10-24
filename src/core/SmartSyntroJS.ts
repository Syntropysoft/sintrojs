/**
 * SMART SyntroJS - Fluent Overhead Loading
 * 
 * Each overhead is loaded via fluent methods:
 * - .withValidation() → Loads SchemaValidator
 * - .withDependencies() → Loads DependencyInjector  
 * - .withErrorHandling() → Loads ErrorHandler
 * - .withOpenAPI() → Loads OpenAPI generator
 * - .withLogging() → Loads logging
 */

import type { FastifyInstance } from 'fastify';
import { DocsRenderer } from '../application/DocsRenderer';
import { ErrorHandler } from '../application/ErrorHandler';
import { OpenAPIGenerator } from '../application/OpenAPIGenerator';
import type { OpenAPIConfig } from '../application/OpenAPIGenerator';
import { RouteRegistry } from '../application/RouteRegistry';
import { Route } from '../domain/Route';
import type { ExceptionHandler, HttpMethod, RouteConfig } from '../domain/types';
import { SmartAdapter } from '../infrastructure/SmartAdapter';

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
 * Smart SyntroJS configuration
 */
export interface SmartSyntroJSConfig {
  /** API title for OpenAPI docs */
  title?: string;
  /** API version */
  version?: string;
  /** API description */
  description?: string;
  /** Routes defined as object (alternative to method chaining) */
  routes?: RouteDefinition;
}

/**
 * Smart SyntroJS main class
 * Fluent API with lazy loading overheads
 */
export class SmartSyntroJS {
  private readonly config: SmartSyntroJSConfig;
  private readonly fastify: FastifyInstance;
  private isStarted = false;
  
  // Lazy loaded features
  private _withValidation = false;
  private _withDependencies = false;
  private _withErrorHandling = false;
  private _withOpenAPI = false;
  private _withLogging = false;

  constructor(config: SmartSyntroJSConfig = {}) {
    this.config = config;
    this.fastify = SmartAdapter.create({
      logger: false, // Start with no logging
    });

    // Register routes from config if provided
    if (config.routes) {
      this.registerRoutesFromConfig(config.routes);
    }
  }

  /**
   * Enables validation overhead (SchemaValidator)
   */
  withValidation(): this {
    this._withValidation = true;
    return this;
  }

  /**
   * Enables dependency injection overhead (DependencyInjector)
   */
  withDependencies(): this {
    this._withDependencies = true;
    return this;
  }

  /**
   * Enables error handling overhead (ErrorHandler)
   */
  withErrorHandling(): this {
    this._withErrorHandling = true;
    return this;
  }

  /**
   * Enables OpenAPI generation overhead
   */
  withOpenAPI(): this {
    this._withOpenAPI = true;
    this.registerOpenAPIEndpoint();
    return this;
  }

  /**
   * Enables logging overhead
   */
  withLogging(): this {
    this._withLogging = true;
    // Recreate Fastify instance with logging
    this.fastify.log = true;
    return this;
  }

  /**
   * Registers a GET route
   */
  get<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('GET', path, config);
  }

  /**
   * Registers a POST route
   */
  post<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('POST', path, config);
  }

  /**
   * Registers a PUT route
   */
  put<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('PUT', path, config);
  }

  /**
   * Registers a DELETE route
   */
  delete<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('DELETE', path, config);
  }

  /**
   * Registers a PATCH route
   */
  patch<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
    return this.registerRoute('PATCH', path, config);
  }

  /**
   * Starts the server
   */
  async listen(port: number, host = '::'): Promise<string> {
    if (port < 0 || port > 65535) {
      throw new Error('Valid port number is required (0-65535)');
    }

    if (this.isStarted) {
      throw new Error('Server is already started');
    }

    // Register all routes
    this.registerAllRoutes();

    // Start server
    const address = await this.fastify.listen({ port, host });
    this.isStarted = true;

    return address;
  }

  /**
   * Closes the server
   */
  async close(): Promise<void> {
    if (!this.isStarted) {
      throw new Error('Server is not started');
    }

    await this.fastify.close();
    this.isStarted = false;
  }

  /**
   * Registers a route with the specified method and path
   */
  private registerRoute<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    method: HttpMethod,
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): this {
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

    for (const route of routes) {
      SmartAdapter.registerRoute(this.fastify, route);
    }
  }

  /**
   * Registers OpenAPI and docs endpoints (lazy loaded)
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
   * Registers routes from config object
   */
  private registerRoutesFromConfig(routes: RouteDefinition): void {
    for (const [path, methods] of Object.entries(routes)) {
      for (const [httpMethod, config] of Object.entries(methods)) {
        if (config) {
          this.registerRoute(httpMethod.toUpperCase() as HttpMethod, path, config);
        }
      }
    }
  }

  /**
   * Gets OpenAPI specification
   */
  private getOpenAPISpec(): any {
    const routes = RouteRegistry.getAll();
    const openApiConfig: OpenAPIConfig = {
      title: this.config.title || 'SyntroJS API',
      version: this.config.version || '1.0.0',
      description: this.config.description || 'SyntroJS API Documentation',
    };

    return OpenAPIGenerator.generate(routes, openApiConfig);
  }
}

// Backward compatibility
export const SyntroJS = SmartSyntroJS;
export type SyntroJSConfig = SmartSyntroJSConfig;
