/**
 * CORS Plugin - Wrapper for @fastify/cors
 *
 * Cross-Origin Resource Sharing configuration for TinyApi
 */

import type { FastifyInstance } from 'fastify';

/**
 * CORS Configuration Options
 */
export interface CorsOptions {
  /**
   * Allowed origins
   * @default '*'
   */
  origin?:
    | string
    | boolean
    | RegExp
    | Array<string | RegExp>
    | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);

  /**
   * Allowed methods
   * @default 'GET,HEAD,PUT,PATCH,POST,DELETE'
   */
  methods?: string | string[];

  /**
   * Allowed headers
   */
  allowedHeaders?: string | string[];

  /**
   * Exposed headers
   */
  exposedHeaders?: string | string[];

  /**
   * Allow credentials
   * @default false
   */
  credentials?: boolean;

  /**
   * Max age for preflight cache
   */
  maxAge?: number;

  /**
   * Preflight continue
   */
  preflightContinue?: boolean;

  /**
   * Strict preflight
   */
  strictPreflight?: boolean;
}

/**
 * Register CORS plugin
 *
 * @param fastify - Fastify instance
 * @param options - CORS options
 *
 * @example
 * ```typescript
 * import { registerCors } from 'tinyapi/plugins';
 *
 * // Allow all origins
 * await registerCors(app.getRawFastify(), { origin: '*' });
 *
 * // Allow specific origins
 * await registerCors(app.getRawFastify(), {
 *   origin: ['https://example.com', 'https://api.example.com'],
 *   credentials: true,
 * });
 * ```
 */
export async function registerCors(
  fastify: FastifyInstance,
  options: CorsOptions = {},
): Promise<void> {
  // Guard clauses
  if (!fastify) {
    throw new Error('Fastify instance is required');
  }

  // Dynamic import to keep @fastify/cors as optional dependency
  let fastifyCors: typeof import('@fastify/cors').default;

  try {
    fastifyCors = (await import('@fastify/cors')).default;
  } catch (error) {
    throw new Error(
      'CORS plugin requires @fastify/cors to be installed. ' + 'Run: pnpm add @fastify/cors',
    );
  }

  // Pass options directly - Fastify handles undefined values correctly
  await fastify.register(fastifyCors, {
    origin: options.origin ?? true,
    credentials: options.credentials ?? false,
    methods: options.methods,
    allowedHeaders: options.allowedHeaders,
    exposedHeaders: options.exposedHeaders,
    maxAge: options.maxAge,
    preflightContinue: options.preflightContinue,
    strictPreflight: options.strictPreflight,
    // biome-ignore lint/suspicious/noExplicitAny: Thin wrapper over Fastify plugin
  } as any);
}
