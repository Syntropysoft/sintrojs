/**
 * FluentAdapter - Tree Shaking Fluent para SyntroJS
 * 
 * Permite configurar dinámicamente qué funcionalidades incluir/excluir
 * usando un API fluido similar a ElysiaJS
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import type { Route } from '../domain/Route';
import type { HttpMethod, RequestContext } from '../domain/types';

export interface FluentAdapterConfig {
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
}

export class FluentAdapter {
  private config: FluentAdapterConfig = {
    logger: false,
    validation: true,
    errorHandling: true,
    dependencyInjection: false,
    backgroundTasks: false,
    openAPI: true,
    compression: false,
    cors: false,
    helmet: false,
    rateLimit: false,
  };

  constructor() {}

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

  // Fluent API para configurar funcionalidades
  withLogger(enabled = true): this {
    this.config.logger = enabled;
    return this;
  }

  withValidation(enabled = true): this {
    this.config.validation = enabled;
    return this;
  }

  withErrorHandling(enabled = true): this {
    this.config.errorHandling = enabled;
    return this;
  }

  withDependencyInjection(enabled = true): this {
    this.config.dependencyInjection = enabled;
    return this;
  }

  withBackgroundTasks(enabled = true): this {
    this.config.backgroundTasks = enabled;
    return this;
  }

  withOpenAPI(enabled = true): this {
    this.config.openAPI = enabled;
    return this;
  }

  withCompression(enabled = true): this {
    this.config.compression = enabled;
    return this;
  }

  withCors(enabled = true): this {
    this.config.cors = enabled;
    return this;
  }

  withHelmet(enabled = true): this {
    this.config.helmet = enabled;
    return this;
  }

  withRateLimit(enabled = true): this {
    this.config.rateLimit = enabled;
    return this;
  }

  // Presets comunes
  minimal(): this {
    return this
      .withLogger(false)
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
    return this
      .withLogger(true)
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
    return this
      .withLogger(true)
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

  // Registrar ruta con funcionalidades dinámicas
  async registerRoute(fastify: FastifyInstance, route: Route): Promise<void> {
    if (!fastify || !route) return;

    const method = route.method.toLowerCase() as Lowercase<HttpMethod>;

    fastify[method](route.path, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Crear contexto básico
        const context: RequestContext = {
          method: request.method as HttpMethod,
          path: request.url,
          params: request.params,
          query: request.query,
          body: request.body,
          headers: request.headers as Record<string, string>,
          cookies: (request as { cookies?: Record<string, string> }).cookies || {},
          correlationId: Math.random().toString(36).substring(2, 15),
          timestamp: new Date(),
          dependencies: {} as Record<string, unknown>,
          background: {
            addTask: (task: () => void) => setImmediate(task),
          },
        };

        // VALIDACIÓN - Solo si está habilitada
        if (this.config.validation) {
          await this.validateRequest(context, route);
        }

        // DEPENDENCY INJECTION - Solo si está habilitada
        if (this.config.dependencyInjection && route.config.dependencies) {
          await this.injectDependencies(context, route);
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
          return reply.status(statusCode).send(validatedResult);
        }

        const statusCode = route.config.status ?? 200;
        return reply.status(statusCode).send(result);

      } catch (error) {
        // ERROR HANDLING - Solo si está habilitado
        if (this.config.errorHandling) {
          return this.handleError(error, reply, route);
        }

        // Error handling mínimo
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return reply.status(500).send({ error: errorMessage });
      }
    });
  }

  private async validateRequest(context: RequestContext, route: Route): Promise<void> {
    if (route.config.params) {
      context.params = route.config.params.parse(context.params);
    }
    if (route.config.query) {
      context.query = route.config.query.parse(context.query);
    }
    if (route.config.body) {
      context.body = route.config.body.parse(context.body);
    }
  }

  private async injectDependencies(context: RequestContext, route: Route): Promise<void> {
    if (route.config.dependencies) {
      try {
        const { DependencyInjector } = await import('../application/DependencyInjector');
        // Simplificar para evitar errores de tipos complejos
        const resolved = await DependencyInjector.resolve(
          route.config.dependencies as any,
          context,
        );
        context.dependencies = resolved.resolved || {};
      } catch {
        // DependencyInjector no disponible, continuar sin él
      }
    }
  }

  private handleError(error: unknown, reply: FastifyReply, route: Route): FastifyReply {
    // Error handling personalizado si existe
    if ((route.config as unknown as { errorHandler?: unknown }).errorHandler) {
      try {
        const errorHandler = (route.config as unknown as { errorHandler: unknown }).errorHandler;
        // Ejecutar error handler personalizado
        // Nota: Esto requeriría más implementación para ser completamente funcional
      } catch {
        // Error handler falló, usar manejo por defecto
      }
    }

    // Error handling por defecto
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return reply.status(500).send({ error: errorMessage });
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
