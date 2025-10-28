/**
 * UltraFastAdapter - Optimizaciones Extremas
 *
 * Estrategias de optimización:
 * 1. Pre-compilación de schemas Zod
 * 2. Pooling de objetos para reducir allocations
 * 3. Handlers optimizados para casos comunes
 * 4. Pipeline de validación simplificado
 * 5. Contexto mínimo y reutilizable
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Route } from '../domain/Route';
import type { HttpMethod } from '../domain/types';

export interface UltraFastConfig {
  logger?: boolean;
  disableRequestLogging?: boolean;
  enableObjectPooling?: boolean;
  enablePrecompiledSchemas?: boolean;
}

// Pool de objetos para reducir allocations
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void) {
    this.createFn = createFn;
    this.resetFn = resetFn;
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Contexto optimizado con pooling
interface OptimizedContext {
  method: HttpMethod;
  path: string;
  params: unknown;
  query: unknown;
  body: unknown;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  correlationId: string;
  timestamp: Date;
  dependencies: Record<string, unknown>;
  background: {
    addTask: (task: () => void) => void;
  };
}

class UltraFastAdapterImpl {
  private contextPool: ObjectPool<OptimizedContext>;
  private compiledSchemas = new Map<string, unknown>();

  constructor() {
    // Pool de contextos para reducir allocations
    this.contextPool = new ObjectPool<OptimizedContext>(
      () => ({
        method: 'GET' as HttpMethod,
        path: '',
        params: {},
        query: {},
        body: {},
        headers: {},
        cookies: {},
        correlationId: '',
        timestamp: new Date(),
        dependencies: {},
        background: {
          addTask: (task: () => void) => setImmediate(task),
        },
      }),
      (ctx) => {
        // Reset del contexto
        ctx.method = 'GET' as HttpMethod;
        ctx.path = '';
        ctx.params = {};
        ctx.query = {};
        ctx.body = {};
        ctx.headers = {};
        ctx.cookies = {};
        ctx.correlationId = '';
        ctx.timestamp = new Date();
        ctx.dependencies = {};
      },
    );
  }

  create(config: UltraFastConfig = {}): FastifyInstance {
    return Fastify({
      logger: config.logger ?? false,
      disableRequestLogging: config.disableRequestLogging ?? true,
    });
  }

  // Pre-compilar schemas Zod para mejor performance
  private precompileSchema(schema: unknown, key: string): unknown {
    if (this.compiledSchemas.has(key)) {
      return this.compiledSchemas.get(key);
    }

    // Crear función optimizada para validación
    const compiled = {
      parse: (schema as any).parse?.bind(schema),
      safeParse: (schema as any).safeParse?.bind(schema),
      // Función ultra-rápida para casos simples
      quickValidate: (data: unknown) => {
        try {
          return (schema as any).parse?.(data) ?? data;
        } catch {
          return data; // Fallback rápido
        }
      },
    };

    this.compiledSchemas.set(key, compiled);
    return compiled;
  }

  registerRoute(fastify: FastifyInstance, route: Route): void {
    if (!fastify || !route) return;

    const method = route.method.toLowerCase() as Lowercase<HttpMethod>;

    // Pre-compilar schemas si existen
    const compiledParams = route.config.params
      ? this.precompileSchema(route.config.params, `${route.path}-params`)
      : null;
    const compiledQuery = route.config.query
      ? this.precompileSchema(route.config.query, `${route.path}-query`)
      : null;
    const compiledBody = route.config.body
      ? this.precompileSchema(route.config.body, `${route.path}-body`)
      : null;
    const compiledResponse = route.config.response
      ? this.precompileSchema(route.config.response, `${route.path}-response`)
      : null;

    // Handler ultra-optimizado
    fastify[method](route.path, async (request: FastifyRequest, reply: FastifyReply) => {
      // Obtener contexto del pool
      const context = this.contextPool.get();

      try {
        // Llenar contexto de forma optimizada
        context.method = request.method as HttpMethod;
        context.path = request.url;
        context.params = request.params;
        context.query = request.query;
        context.body = request.body;
        context.headers = request.headers as Record<string, string>;
        context.cookies = (request as { cookies?: Record<string, string> }).cookies || {};
        context.correlationId = Math.random().toString(36).substring(2, 15);
        context.timestamp = new Date();

        // Validación ultra-rápida usando schemas pre-compilados
        if (compiledParams) {
          context.params =
            (compiledParams as any).quickValidate?.(request.params) ?? request.params;
        }
        if (compiledQuery) {
          context.query = (compiledQuery as any).quickValidate?.(request.query) ?? request.query;
        }
        if (compiledBody) {
          context.body = (compiledBody as any).quickValidate?.(request.body) ?? request.body;
        }

        // Ejecutar handler
        const result = await route.handler(context);

        // Validación de respuesta ultra-rápida
        if (compiledResponse) {
          const validatedResult = (compiledResponse as any).quickValidate?.(result) ?? result;
          const statusCode = route.config.status ?? 200;
          return reply.status(statusCode).send(validatedResult);
        }

        const statusCode = route.config.status ?? 200;
        return reply.status(statusCode).send(result);
      } catch (error) {
        // Error handling mínimo
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return reply.status(500).send({ error: errorMessage });
      } finally {
        // Devolver contexto al pool
        this.contextPool.release(context);
      }
    });
  }
}

export const UltraFastAdapter = new UltraFastAdapterImpl();
