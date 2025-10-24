/**
 * ULTRA-OPTIMIZED SyntroJS Core
 * 
 * Target: 30,000+ req/sec (50% of Fastify performance)
 * Strategy: Minimal overhead, maximum performance
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Route } from '../domain/Route';
import type { HttpMethod } from '../domain/types';

// Global schema cache
const SCHEMA_CACHE = new Map<string, any>();
const ROUTE_CACHE = new Map<string, any>();

export interface UltraOptimizedConfig {
  logger?: boolean;
  disableRequestLogging?: boolean;
}

class UltraOptimizedAdapter {
  create(config: UltraOptimizedConfig = {}): FastifyInstance {
    const { createFastify } = require('fastify');
    
    return createFastify({
      logger: config.logger ?? false,
      disableRequestLogging: config.disableRequestLogging ?? true,
    });
  }

  registerRoute(fastify: FastifyInstance, route: Route): void {
    if (!fastify || !route) return;

    const method = route.method.toLowerCase() as Lowercase<HttpMethod>;
    const routeKey = `${method}:${route.path}`;
    
    // Pre-compile everything at startup
    this.preCompileRoute(route, routeKey);

    // Ultra-optimized handler
    fastify[method](route.path, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // MINIMAL context - no object creation overhead
        const context = {
          method: request.method,
          path: request.url,
          params: request.params,
          query: request.query,
          body: request.body,
          headers: request.headers,
          dependencies: {} as Record<string, unknown>,
          background: {
            addTask: (task: () => void) => setImmediate(task)
          }
        };

        // ULTRA-FAST validation using cached schemas
        const cached = ROUTE_CACHE.get(routeKey);
        if (cached) {
          if (cached.paramsSchema) {
            context.params = cached.paramsSchema.parse(request.params);
          }
          if (cached.querySchema) {
            context.query = cached.querySchema.parse(request.query);
          }
          if (cached.bodySchema) {
            context.body = cached.bodySchema.parse(request.body);
          }
        }

        // DIRECT handler execution - no middleware overhead
        const result = await route.handler(context);

        // MINIMAL response validation
        if (cached?.responseSchema) {
          const validatedResult = cached.responseSchema.parse(result);
          return reply.send(validatedResult);
        }

        return reply.send(result);

      } catch (error) {
        // MINIMAL error handling
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    });
  }

  private preCompileRoute(route: Route, routeKey: string): void {
    const compiled: any = {};
    
    // Cache compiled schemas
    if (route.config.params) {
      const cacheKey = `params:${routeKey}`;
      if (!SCHEMA_CACHE.has(cacheKey)) {
        SCHEMA_CACHE.set(cacheKey, route.config.params);
      }
      compiled.paramsSchema = route.config.params;
    }

    if (route.config.query) {
      const cacheKey = `query:${routeKey}`;
      if (!SCHEMA_CACHE.has(cacheKey)) {
        SCHEMA_CACHE.set(cacheKey, route.config.query);
      }
      compiled.querySchema = route.config.query;
    }

    if (route.config.body) {
      const cacheKey = `body:${routeKey}`;
      if (!SCHEMA_CACHE.has(cacheKey)) {
        SCHEMA_CACHE.set(cacheKey, route.config.body);
      }
      compiled.bodySchema = route.config.body;
    }

    if (route.config.response) {
      const cacheKey = `response:${routeKey}`;
      if (!SCHEMA_CACHE.has(cacheKey)) {
        SCHEMA_CACHE.set(cacheKey, route.config.response);
      }
      compiled.responseSchema = route.config.response;
    }

    ROUTE_CACHE.set(routeKey, compiled);
  }
}

export const UltraOptimizedAdapter = new UltraOptimizedAdapter();
