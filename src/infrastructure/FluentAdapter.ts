/**
 * FluentAdapter - Tree Shaking Fluent para SyntroJS
 *
 * Responsibility: Dynamic feature configuration with fluent API
 * Pattern: Builder Pattern + Fluent Interface
 * Principles: SOLID, DDD, Functional Programming, Guard Clauses
 *
 * Permite configurar dinámicamente qué funcionalidades incluir/excluir
 * usando un API fluido similar a
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import type { MiddlewareRegistry } from '../application/MiddlewareRegistry';
import type { Route } from '../domain/Route';
import type {
  DependencyResolverFactory,
  ErrorHandlerFactory,
  HttpMethod,
  Middleware,
  MiddlewareFactory,
  RequestContext,
  SchemaFactory,
} from '../domain/types';
import { setComponentLoggingEnabled } from './LoggerHelper';
import { type LoggerIntegrationConfig, integrateLogger } from './LoggerIntegration';

export interface FluentAdapterConfig {
  /** Enable Fastify built-in logger (legacy) */
  logger?: boolean;
  /** Enable @syntrojs/logger integration */
  syntroLogger?: LoggerIntegrationConfig | boolean;
  /** Enable component-level logging (ErrorHandler, BackgroundTasks, etc.) */
  componentLogging?: boolean;
  validation?: boolean;
  errorHandling?: boolean;
  dependencyInjection?: boolean;
  backgroundTasks?: boolean;
  openAPI?: boolean;
  compression?: boolean;
  cors?: boolean;
  helmet?: boolean;
  rateLimit?: boolean;
  middleware?: boolean; // Nuevo: soporte para middleware
}

export class FluentAdapter {
  private readonly config: FluentAdapterConfig;
  private middlewareRegistry?: MiddlewareRegistry;

  // Factory instances for type-safe operations
  private dependencyFactories: Map<string, DependencyResolverFactory> = new Map();
  private errorHandlerFactories: Map<string, ErrorHandlerFactory> = new Map();
  private schemaFactories: Map<string, SchemaFactory> = new Map();
  private middlewareFactories: Map<string, MiddlewareFactory> = new Map();

  constructor() {
    // Initialize immutable default configuration
    this.config = Object.freeze({
      logger: false,
      validation: true,
      errorHandling: true,
      dependencyInjection: true,
      backgroundTasks: true,
      openAPI: true,
      compression: false,
      cors: false,
      helmet: false,
      rateLimit: false,
      middleware: true,
    });
  }

  // Métodos estáticos para compatibilidad con otros adapters
  static create(config?: Record<string, unknown>): FastifyInstance {
    const adapter = new FluentAdapter();
    if (config?.logger !== undefined) {
      adapter.withLogger(config.logger as boolean);
    }
    return adapter.create();
  }

  static async registerRoute(fastify: FastifyInstance, route: Route): Promise<void> {
    const adapter = new FluentAdapter();
    return adapter.registerRoute(fastify, route);
  }

  static async listen(fastify: FastifyInstance, port: number, host = '::'): Promise<string> {
    const adapter = new FluentAdapter();
    return adapter.listen(fastify, port, host);
  }

  static async close(fastify: FastifyInstance): Promise<void> {
    await fastify.close();
  }

  // Fluent API para configurar funcionalidades - Functional Programming
  withLogger(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Logger enabled must be a boolean');
    }

    // Create new instance with updated config (immutability)
    return this.createWithConfig({ logger: enabled });
  }

  withSyntroLogger(config: LoggerIntegrationConfig | boolean = true): this {
    // Guard clause: validate type
    if (typeof config !== 'boolean' && (typeof config !== 'object' || config === null)) {
      throw new Error('SyntroLogger config must be a boolean or LoggerIntegrationConfig object');
    }

    // Create new instance with updated config (immutability)
    return this.createWithConfig({ syntroLogger: config });
  }

  withComponentLogging(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Component logging enabled must be a boolean');
    }

    // Create new instance with updated config (immutability)
    return this.createWithConfig({ componentLogging: enabled });
  }

  withValidation(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Validation enabled must be a boolean');
    }

    return this.createWithConfig({ validation: enabled });
  }

  withErrorHandling(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Error handling enabled must be a boolean');
    }

    return this.createWithConfig({ errorHandling: enabled });
  }

  withDependencyInjection(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Dependency injection enabled must be a boolean');
    }

    return this.createWithConfig({ dependencyInjection: enabled });
  }

  withBackgroundTasks(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Background tasks enabled must be a boolean');
    }

    return this.createWithConfig({ backgroundTasks: enabled });
  }

  withOpenAPI(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('OpenAPI enabled must be a boolean');
    }

    return this.createWithConfig({ openAPI: enabled });
  }

  withCompression(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Compression enabled must be a boolean');
    }

    return this.createWithConfig({ compression: enabled });
  }

  withCors(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('CORS enabled must be a boolean');
    }

    return this.createWithConfig({ cors: enabled });
  }

  withHelmet(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Helmet enabled must be a boolean');
    }

    return this.createWithConfig({ helmet: enabled });
  }

  withRateLimit(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Rate limit enabled must be a boolean');
    }

    return this.createWithConfig({ rateLimit: enabled });
  }

  withMiddleware(enabled = true): this {
    // Guard clause: validate boolean
    if (typeof enabled !== 'boolean') {
      throw new Error('Middleware enabled must be a boolean');
    }

    return this.createWithConfig({ middleware: enabled });
  }

  /**
   * Create new instance with updated configuration (Functional Programming)
   *
   * @param updates - Configuration updates
   * @returns New FluentAdapter instance
   */
  private createWithConfig(updates: Partial<FluentAdapterConfig>): this {
    const newConfig = Object.freeze({ ...this.config, ...updates });
    const newInstance = Object.create(Object.getPrototypeOf(this));
    newInstance.config = newConfig;
    newInstance.middlewareRegistry = this.middlewareRegistry;
    return newInstance;
  }

  // Presets comunes - Functional Composition
  minimal(): this {
    return this.withLogger(false)
      .withValidation(false)
      .withErrorHandling(false)
      .withDependencyInjection(false)
      .withBackgroundTasks(false)
      .withOpenAPI(false)
      .withCompression(false)
      .withCors(false)
      .withHelmet(false)
      .withRateLimit(false);
  }

  standard(): this {
    return this.withLogger(true)
      .withValidation(true)
      .withErrorHandling(true)
      .withDependencyInjection(false)
      .withBackgroundTasks(false)
      .withOpenAPI(true)
      .withCompression(false)
      .withCors(false)
      .withHelmet(false)
      .withRateLimit(false);
  }

  production(): this {
    return this.withLogger(true)
      .withValidation(true)
      .withErrorHandling(true)
      .withDependencyInjection(true)
      .withBackgroundTasks(true)
      .withOpenAPI(true)
      .withCompression(true)
      .withCors(true)
      .withHelmet(true)
      .withRateLimit(true);
  }

  // Crear instancia de Fastify con configuración fluida
  create(): FastifyInstance {
    const fastify = Fastify({
      logger: this.config.logger ?? false,
    });

    // Integrate @syntrojs/logger if enabled
    if (this.config.syntroLogger) {
      const loggerConfig: LoggerIntegrationConfig =
        typeof this.config.syntroLogger === 'boolean'
          ? {
              enabled: this.config.syntroLogger,
              componentLogging: this.config.componentLogging,
            }
          : {
              ...this.config.syntroLogger,
              componentLogging:
                this.config.componentLogging !== undefined
                  ? this.config.componentLogging
                  : this.config.syntroLogger.componentLogging,
            };
      integrateLogger(fastify, loggerConfig);
    } else if (this.config.componentLogging !== undefined) {
      // If only componentLogging is configured, set it directly
      setComponentLoggingEnabled(this.config.componentLogging);
    }

    // Registrar plugins solo si están habilitados
    this.registerPlugins(fastify);

    return fastify;
  }

  private async registerPlugins(fastify: FastifyInstance): Promise<void> {
    // Solo registrar plugins que están habilitados
    if (this.config.compression) {
      try {
        await fastify.register(import('@fastify/compress'));
      } catch {
        // Plugin no disponible, continuar sin él
      }
    }

    if (this.config.cors) {
      try {
        await fastify.register(import('@fastify/cors'));
      } catch {
        // Plugin no disponible, continuar sin él
      }
    }

    if (this.config.helmet) {
      try {
        await fastify.register(import('@fastify/helmet'));
      } catch {
        // Plugin no disponible, continuar sin él
      }
    }

    if (this.config.rateLimit) {
      try {
        await fastify.register(import('@fastify/rate-limit'));
      } catch {
        // Plugin no disponible, continuar sin él
      }
    }
  }

  /**
   * Configure middleware registry
   */
  withMiddlewareRegistry(registry: MiddlewareRegistry): this {
    this.middlewareRegistry = registry;
    return this;
  }

  // Registrar ruta con funcionalidades dinámicas
  async registerRoute(fastify: FastifyInstance, route: Route): Promise<void> {
    if (!fastify || !route) return;

    const method = route.method.toLowerCase() as Lowercase<HttpMethod>;

    fastify[method](route.path, async (request: FastifyRequest, reply: FastifyReply) => {
      // Crear contexto básico fuera del try block para que esté disponible en el catch
      const context: RequestContext = {
        method: request.method as HttpMethod,
        path: request.url,
        params: request.params,
        query: request.query,
        body: request.body,
        headers: request.headers as Record<string, string>,
        cookies: (request as { cookies?: Record<string, string> }).cookies || {},
        correlationId:
          (request.headers['x-correlation-id'] as string) ||
          Math.random().toString(36).substring(2, 15),
        timestamp: new Date(),
        dependencies: {} as Record<string, unknown>,
        background: {
          addTask: async (task: () => void, options?: { name?: string; timeout?: number }) => {
            if (this.config.backgroundTasks) {
              // Usar BackgroundTasks real si está habilitado
              await this.addBackgroundTask(task, options);
            } else {
              // Fallback básico
              setImmediate(task);
            }
          },
        },
      };

      // Ejecutar middleware si está habilitado
      if (this.config.middleware && this.middlewareRegistry) {
        const middlewares = this.middlewareRegistry.getMiddlewares(route.path, route.method);
        if (middlewares.length > 0) {
          await this.middlewareRegistry.executeMiddlewares(middlewares, context);
        }
      }

      try {
        // VALIDACIÓN - Solo si está habilitada
        if (this.config.validation) {
          await this.validateRequest(context, route);
        }

        // DEPENDENCY INJECTION - Solo si está habilitada
        let cleanupFn: (() => Promise<void>) | undefined;
        if (this.config.dependencyInjection && route.config.dependencies) {
          cleanupFn = await this.injectDependencies(context, route);
        }

        // BACKGROUND TASKS - Solo si están habilitadas
        if (this.config.backgroundTasks) {
          // Configurar background tasks si es necesario
        }

        // Ejecutar handler
        const result = await route.handler(context);

        // VALIDACIÓN DE RESPUESTA - Solo si está habilitada
        if (this.config.validation && route.config.response) {
          const validatedResult = route.config.response.parse(result);
          const statusCode = route.config.status ?? 200;

          // Ejecutar cleanup después de enviar la respuesta
          if (cleanupFn) {
            setImmediate(() => cleanupFn!());
          }

          return reply.status(statusCode).send(validatedResult);
        }

        // Check if result is a RouteResponse object (has status, body, headers)
        if (result && typeof result === 'object' && 'status' in result && 'body' in result) {
          const response = result as {
            status: number;
            body: unknown;
            headers?: Record<string, string>;
          };

          // Set content type first if provided
          if (response.headers?.['Content-Type']) {
            reply.type(response.headers['Content-Type']);
          }

          // Set other headers if provided
          if (response.headers) {
            for (const [key, value] of Object.entries(response.headers)) {
              if (key !== 'Content-Type') {
                reply.header(key, value);
              }
            }
          }

          // Ejecutar cleanup después de enviar la respuesta
          if (cleanupFn) {
            setImmediate(() => cleanupFn!());
          }

          return reply.status(response.status).send(response.body);
        }

        const statusCode = route.config.status ?? 200;

        // Ejecutar cleanup después de enviar la respuesta
        if (cleanupFn) {
          setImmediate(() => cleanupFn!());
        }

        return reply.status(statusCode).send(result);
      } catch (error) {
        // ERROR HANDLING - Solo si está habilitado
        if (this.config.errorHandling) {
          return await this.handleError(error, reply, route, context);
        }

        // Error handling mínimo
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return reply.status(500).send({ error: errorMessage });
      }
    });
  }

  private async validateRequest(context: RequestContext, route: Route): Promise<void> {
    // Crear factories para validación si no existen
    const routeKey = `${route.method}:${route.path}`;

    if (route.config.params) {
      let factory = this.schemaFactories.get(`${routeKey}:params`);
      if (!factory) {
        const { createSchemaFactory } = await import('../domain/factories');
        factory = createSchemaFactory(route.config.params);
        this.schemaFactories.set(`${routeKey}:params`, factory);
      }
      context.params = factory.quickValidate(context.params);
    }

    if (route.config.query) {
      let factory = this.schemaFactories.get(`${routeKey}:query`);
      if (!factory) {
        const { createSchemaFactory } = await import('../domain/factories');
        factory = createSchemaFactory(route.config.query);
        this.schemaFactories.set(`${routeKey}:query`, factory);
      }
      context.query = factory.quickValidate(context.query);
    }

    if (route.config.body) {
      let factory = this.schemaFactories.get(`${routeKey}:body`);
      if (!factory) {
        const { createSchemaFactory } = await import('../domain/factories');
        factory = createSchemaFactory(route.config.body);
        this.schemaFactories.set(`${routeKey}:body`, factory);
      }
      context.body = factory.quickValidate(context.body);
    }
  }

  private async injectDependencies(
    context: RequestContext,
    route: Route,
  ): Promise<(() => Promise<void>) | undefined> {
    if (!route.config.dependencies) return undefined;

    const routeKey = `${route.method}:${route.path}`;
    let factory = this.dependencyFactories.get(routeKey);

    if (!factory) {
      const { createDependencyResolverFactory } = await import('../domain/factories');
      factory = createDependencyResolverFactory(route.config.dependencies);
      this.dependencyFactories.set(routeKey, factory);
    }

    return factory.resolve(context);
  }

  private async addBackgroundTask(
    task: () => void,
    options?: { name?: string; timeout?: number },
  ): Promise<void> {
    try {
      const { BackgroundTasks } = await import('../application/BackgroundTasks');
      BackgroundTasks.addTask(task, options);
    } catch {
      // BackgroundTasks no disponible, usar fallback básico
      setImmediate(task);
    }
  }

  private async handleError(
    error: unknown,
    reply: FastifyReply,
    route: Route,
    context?: RequestContext,
  ): Promise<FastifyReply> {
    try {
      // Error handling personalizado si existe
      if ((route.config as unknown as { errorHandler?: unknown }).errorHandler) {
        const errorHandler = (route.config as unknown as { errorHandler: unknown }).errorHandler;
        if (context && typeof errorHandler === 'function') {
          const response = await (errorHandler as any)(context, error);
          return reply.status(response.status).send(response.body);
        }
      }

      // Usar Factory Pattern para ErrorHandler
      const routeKey = `${route.method}:${route.path}`;
      let factory = this.errorHandlerFactories.get(routeKey);

      if (!factory) {
        const { createErrorHandlerFactory } = await import('../domain/factories');
        factory = createErrorHandlerFactory();
        this.errorHandlerFactories.set(routeKey, factory);
      }

      if (context) {
        const response = await factory.handle(context, error as Error);

        // Aplicar headers si existen
        if (response.headers) {
          for (const [key, value] of Object.entries(response.headers)) {
            reply.header(key, value as string);
          }
        }

        return reply.status(response.status).send(response.body);
      }

      // Fallback básico
      const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
      return reply.status(500).send({ error: errorMessage });
    } catch (handlerError) {
      // Fallback final
      const errorMessage =
        handlerError instanceof Error ? handlerError.message : 'Internal Server Error';
      return reply.status(500).send({ error: errorMessage });
    }
  }

  async listen(fastify: FastifyInstance, port: number, host = '::'): Promise<string> {
    const address = await fastify.listen({ port, host });
    return address;
  }

  async close(fastify: FastifyInstance): Promise<void> {
    await fastify.close();
  }
}

// Factory function para crear adapters fluidos
export function createFluentAdapter(): FluentAdapter {
  return new FluentAdapter();
}

// Presets predefinidos
export const FluentPresets = {
  minimal: () => createFluentAdapter().minimal(),
  standard: () => createFluentAdapter().standard(),
  production: () => createFluentAdapter().production(),
};
