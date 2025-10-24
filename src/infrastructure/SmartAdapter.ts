/**
 * SMART SyntroJS - Lazy Loading Overheads
 *
 * Overheads are loaded ONLY when needed:
 * - buildContext() → Only if context is accessed
 * - DependencyInjector → Only if dependencies are defined
 * - SchemaValidator → Only if schemas are defined
 * - ErrorHandler → Only if custom error handlers exist
 * - OpenAPI → Only if /docs or /openapi.json is requested
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import type { Route } from '../domain/Route';
import type { HttpMethod } from '../domain/types';

export interface SmartConfig {
  logger?: boolean;
  disableRequestLogging?: boolean;
}

class SmartAdapterImpl {
  create(config: SmartConfig = {}): FastifyInstance {
    return Fastify({
      logger: config.logger ?? false,
      disableRequestLogging: config.disableRequestLogging ?? true,
    });
  }

  registerRoute(fastify: FastifyInstance, route: Route): void {
    if (!fastify || !route) return;

    const method = route.method.toLowerCase() as Lowercase<HttpMethod>;

    // SMART handler - lazy loading everything
    fastify[method](route.path, async (request: FastifyRequest, reply: FastifyReply) => {
      // LAZY CONTEXT - only create if needed
      let context: any = null;
      const getContext = () => {
        if (!context) {
          context = {
            method: request.method,
            path: request.url,
            params: request.params,
            query: request.query,
            body: request.body,
            headers: request.headers,
            cookies: (request as any).cookies || {},
            correlationId: Math.random().toString(36).substring(2, 15),
            timestamp: new Date(),
            dependencies: {} as Record<string, unknown>,
            background: {
              addTask: (task: () => void) => setImmediate(task),
            },
          };
        }
        return context;
      };

      try {
        // LAZY VALIDATION - only if schemas exist
        if (route.config.params) {
          const ctx = getContext();
          ctx.params = route.config.params.parse(request.params);
        }
        if (route.config.query) {
          const ctx = getContext();
          ctx.query = route.config.query.parse(request.query);
        }
        if (route.config.body) {
          const ctx = getContext();
          ctx.body = route.config.body.parse(request.body);
        }

        // LAZY DEPENDENCIES - only if dependencies are defined
        if (route.config.dependencies) {
          const ctx = getContext();
          // Load DependencyInjector only when needed
          const { DependencyInjector } = await import('../application/DependencyInjector');
          const { resolved } = await DependencyInjector.resolve(
            route.config.dependencies as any,
            ctx,
          );
          ctx.dependencies = resolved;
        }

        // Execute handler with lazy context
        const result = await route.handler(getContext());

        // LAZY RESPONSE VALIDATION - only if response schema exists
        if (route.config.response) {
          const validatedResult = route.config.response.parse(result);
          const statusCode = route.config.status ?? 200;
          return reply.status(statusCode).send(validatedResult);
        }

        const statusCode = route.config.status ?? 200;
        return reply.status(statusCode).send(result);
      } catch (error) {
        // LAZY ERROR HANDLING - only if custom error handlers exist
        if ((route.config as any).errorHandler) {
          const ctx = getContext();
          const response = await (route.config as any).errorHandler(error as Error, ctx);
          return reply.status(response.status).send(response.body);
        }

        // MINIMAL error handling
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return reply.status(500).send({ error: errorMessage });
      }
    });
  }
}

export const SmartAdapter = new SmartAdapterImpl();
