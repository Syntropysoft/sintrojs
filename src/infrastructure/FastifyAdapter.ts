/**
 * FastifyAdapter - Infrastructure Layer
 *
 * Responsibility: Adapt Fastify to work with our domain models
 * Pattern: Adapter Pattern
 * Principles: Dependency Inversion (depend on abstractions, not Fastify directly)
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import { BackgroundTasks } from '../application/BackgroundTasks';
import { DependencyInjector } from '../application/DependencyInjector';
import type { DependencyMetadata } from '../application/DependencyInjector';
import { ErrorHandler } from '../application/ErrorHandler';
import { MiddlewareRegistry } from '../application/MiddlewareRegistry';
import { SchemaValidator } from '../application/SchemaValidator';
import type { Route } from '../domain/Route';
import type { HttpMethod, RequestContext } from '../domain/types';

/**
 * Fastify adapter configuration
 */
export interface FastifyAdapterConfig {
  logger?: boolean;
  disableRequestLogging?: boolean;
}

/**
 * Fastify adapter implementation
 */
class FastifyAdapterImpl {
  private middlewareRegistry?: MiddlewareRegistry;

  /**
   * Creates and configures Fastify instance
   *
   * Each call creates a NEW instance (no singleton at this level)
   *
   * @param config - Adapter configuration
   * @returns Configured Fastify instance
   */
  create(config: FastifyAdapterConfig = {}): FastifyInstance {
    // Create NEW Fastify instance every time
    const instance = Fastify({
      logger: config.logger ?? false,
      disableRequestLogging: config.disableRequestLogging ?? true,
    });

    return instance;
  }

  /**
   * Set middleware registry for this adapter
   */
  setMiddlewareRegistry(registry: MiddlewareRegistry): void {
    this.middlewareRegistry = registry;
  }

  /**
   * Registers a route with Fastify
   *
   * @param fastify - Fastify instance
   * @param route - Route to register
   */
  registerRoute(fastify: FastifyInstance, route: Route): void {
    // Guard clauses
    if (!fastify) {
      throw new Error('Fastify instance is required');
    }

    if (!route) {
      throw new Error('Route is required');
    }

    // Convert method to lowercase for Fastify
    const method = route.method.toLowerCase() as Lowercase<HttpMethod>;

    // Register route with Fastify
    fastify[method](route.path, async (request: FastifyRequest, reply: FastifyReply) => {
      let cleanup: (() => Promise<void>) | undefined;

      try {
        // Build request context from Fastify request
        const context = this.buildContext(request);

        // Execute middlewares if registry is available
        if (this.middlewareRegistry) {
          const middlewares = this.middlewareRegistry.getMiddlewares(route.path, route.method);
          if (middlewares.length > 0) {
            await this.middlewareRegistry.executeMiddlewares(middlewares, context);
          }
        }

        // Resolve dependencies if specified
        if (route.config.dependencies) {
          const { resolved, cleanup: cleanupFn } = await DependencyInjector.resolve(
            route.config.dependencies as Record<string, DependencyMetadata<unknown>>,
            context,
          );
          context.dependencies = resolved;
          cleanup = cleanupFn;
        } else {
          // No dependencies, use empty object
          context.dependencies = {};
        }

        // Validate params if schema exists
        if (route.config.params) {
          context.params = SchemaValidator.validateOrThrow(route.config.params, request.params);
        }

        // Validate query if schema exists
        if (route.config.query) {
          context.query = SchemaValidator.validateOrThrow(route.config.query, request.query);
        }

        // Validate body if schema exists
        if (route.config.body) {
          context.body = SchemaValidator.validateOrThrow(route.config.body, request.body);
        }

        // Execute handler
        const result = await route.handler(context);

        // Validate response if schema exists
        if (route.config.response) {
          SchemaValidator.validateOrThrow(route.config.response, result);
        }

        // Cleanup dependencies
        if (cleanup) {
          await cleanup();
        }

        // Send response
        const statusCode = route.config.status ?? 200;
        return reply.status(statusCode).send(result);
      } catch (error) {
        // Cleanup dependencies on error
        if (cleanup) {
          try {
            await cleanup();
          } catch (cleanupError) {
            // Log cleanup error but don't override original error
            console.error('Dependency cleanup failed:', cleanupError);
          }
        }

        // Handle error using ErrorHandler
        const context = this.buildContext(request);
        context.dependencies = {}; // Empty dependencies for error context
        const response = await ErrorHandler.handle(error as Error, context);

        // Send error response
        if (response.headers) {
          for (const [key, value] of Object.entries(response.headers)) {
            reply.header(key, value);
          }
        }

        return reply.status(response.status).send(response.body);
      }
    });
  }

  /**
   * Builds request context from Fastify request
   *
   * Pure function: transforms Fastify request to our context
   *
   * @param request - Fastify request
   * @returns Request context
   */
  private buildContext(request: FastifyRequest): RequestContext {
    return {
      method: request.method as HttpMethod,
      path: request.url,
      // biome-ignore lint/suspicious/noExplicitAny: Fastify params type is unknown, we validate later
      params: request.params as any,
      // biome-ignore lint/suspicious/noExplicitAny: Fastify query type is unknown, we validate later
      query: request.query as any,
      // biome-ignore lint/suspicious/noExplicitAny: Fastify body type is unknown, we validate later
      body: request.body as any,
      headers: request.headers as Record<string, string>,
      // biome-ignore lint/suspicious/noExplicitAny: Cookies plugin may not be installed
      cookies: (request as any).cookies ?? {},
      correlationId: (request.headers['x-correlation-id'] as string) ?? this.generateId(),
      timestamp: new Date(),
      // Dependencies will be resolved later if needed
      dependencies: {},
      // Background tasks manager
      background: {
        addTask: (task, options) => BackgroundTasks.addTask(task, options),
      },
    };
  }

  /**
   * Generates a unique correlation ID
   *
   * Pure function: generates random ID
   *
   * @returns Correlation ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Starts Fastify server
   *
   * @param fastify - Fastify instance
   * @param port - Port to listen on
   * @param host - Host to bind to
   * @returns Server address
   */
  async listen(fastify: FastifyInstance, port: number, host = '0.0.0.0'): Promise<string> {
    // Guard clauses
    if (!fastify) {
      throw new Error('Fastify instance is required');
    }

    if (port < 0 || port > 65535) {
      throw new Error('Valid port number is required (0-65535)');
    }

    // Start server
    const address = await fastify.listen({ port, host });

    return address;
  }

  /**
   * Stops Fastify server
   *
   * @param fastify - Fastify instance
   */
  async close(fastify: FastifyInstance): Promise<void> {
    // Guard clause
    if (!fastify) {
      throw new Error('Fastify instance is required');
    }

    await fastify.close();
  }
}

/**
 * Exported singleton (Module Pattern)
 */
class FastifyAdapterSingleton {
  private static instance: FastifyAdapterImpl = new FastifyAdapterImpl();

  static create(config?: FastifyAdapterConfig): FastifyInstance {
    return FastifyAdapterSingleton.instance.create(config);
  }

  static setMiddlewareRegistry(registry: MiddlewareRegistry): void {
    FastifyAdapterSingleton.instance.setMiddlewareRegistry(registry);
  }

  static registerRoute(fastify: FastifyInstance, route: Route): void {
    FastifyAdapterSingleton.instance.registerRoute(fastify, route);
  }

  static async listen(fastify: FastifyInstance, port: number, host = '0.0.0.0'): Promise<string> {
    return FastifyAdapterSingleton.instance.listen(fastify, port, host);
  }

  static async close(fastify: FastifyInstance): Promise<void> {
    return FastifyAdapterSingleton.instance.close(fastify);
  }
}

export const FastifyAdapter = FastifyAdapterSingleton;

/**
 * Factory for testing
 */
export const createFastifyAdapter = (): FastifyAdapterImpl => new FastifyAdapterImpl();
