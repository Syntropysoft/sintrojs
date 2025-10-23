/**
 * Helmet Plugin - Wrapper for @fastify/helmet
 *
 * Security headers configuration for TinyApi
 */

import type { FastifyInstance } from 'fastify';

/**
 * Helmet Configuration Options
 *
 * Sets secure HTTP headers to protect against common vulnerabilities
 */
export interface HelmetOptions {
  /**
   * Enable all security headers
   * @default true
   */
  global?: boolean;

  /**
   * Content Security Policy
   */
  contentSecurityPolicy?: boolean | Record<string, unknown>;

  /**
   * Cross-Origin-Embedder-Policy
   */
  crossOriginEmbedderPolicy?: boolean;

  /**
   * Cross-Origin-Opener-Policy
   */
  crossOriginOpenerPolicy?: boolean;

  /**
   * Cross-Origin-Resource-Policy
   */
  crossOriginResourcePolicy?: boolean;

  /**
   * Origin-Agent-Cluster
   */
  originAgentCluster?: boolean;

  /**
   * Referrer-Policy
   */
  referrerPolicy?: boolean | { policy: string | string[] };

  /**
   * Strict-Transport-Security
   */
  hsts?:
    | boolean
    | {
        maxAge?: number;
        includeSubDomains?: boolean;
        preload?: boolean;
      };

  /**
   * X-Content-Type-Options
   */
  noSniff?: boolean;

  /**
   * X-DNS-Prefetch-Control
   */
  dnsPrefetchControl?: boolean;

  /**
   * X-Download-Options
   */
  ieNoOpen?: boolean;

  /**
   * X-Frame-Options
   */
  frameguard?: boolean | { action: string };

  /**
   * X-Permitted-Cross-Domain-Policies
   */
  permittedCrossDomainPolicies?: boolean;

  /**
   * X-XSS-Protection
   */
  xssFilter?: boolean;
}

/**
 * Register Helmet plugin
 *
 * @param fastify - Fastify instance
 * @param options - Helmet options
 *
 * @example
 * ```typescript
 * import { registerHelmet } from 'tinyapi/plugins';
 *
 * // Enable all security headers (default)
 * await registerHelmet(app.getRawFastify());
 *
 * // Custom configuration
 * await registerHelmet(app.getRawFastify(), {
 *   contentSecurityPolicy: {
 *     directives: {
 *       defaultSrc: ["'self'"],
 *       styleSrc: ["'self'", "'unsafe-inline'"],
 *     },
 *   },
 * });
 * ```
 */
export async function registerHelmet(
  fastify: FastifyInstance,
  options: HelmetOptions = {},
): Promise<void> {
  // Guard clauses
  if (!fastify) {
    throw new Error('Fastify instance is required');
  }

  // Dynamic import to keep @fastify/helmet as optional dependency
  let fastifyHelmet: typeof import('@fastify/helmet').default;

  try {
    fastifyHelmet = (await import('@fastify/helmet')).default;
  } catch (error) {
    throw new Error(
      'Helmet plugin requires @fastify/helmet to be installed. ' + 'Run: pnpm add @fastify/helmet',
    );
  }

  // Pass options directly - Fastify handles undefined values correctly
  await fastify.register(fastifyHelmet, {
    global: options.global ?? true,
    contentSecurityPolicy: options.contentSecurityPolicy,
    crossOriginEmbedderPolicy: options.crossOriginEmbedderPolicy,
    crossOriginOpenerPolicy: options.crossOriginOpenerPolicy,
    crossOriginResourcePolicy: options.crossOriginResourcePolicy,
    originAgentCluster: options.originAgentCluster,
    referrerPolicy: options.referrerPolicy,
    hsts: options.hsts,
    noSniff: options.noSniff,
    dnsPrefetchControl: options.dnsPrefetchControl,
    ieNoOpen: options.ieNoOpen,
    frameguard: options.frameguard,
    permittedCrossDomainPolicies: options.permittedCrossDomainPolicies,
    xssFilter: options.xssFilter,
    // biome-ignore lint/suspicious/noExplicitAny: Thin wrapper over Fastify plugin
  } as any);
}
