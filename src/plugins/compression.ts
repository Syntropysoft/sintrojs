/**
 * Compression Plugin - Wrapper for @fastify/compress
 *
 * Response compression for TinyApi (gzip, deflate, brotli)
 */

import type { FastifyInstance } from 'fastify';

/**
 * Compression Configuration Options
 */
export interface CompressionOptions {
  /**
   * Enable/disable compression globally
   * @default true
   */
  global?: boolean;

  /**
   * Compression threshold in bytes
   * Only compress responses larger than this
   * @default 1024 (1KB)
   */
  threshold?: number;

  /**
   * Compression encodings to use
   * @default ['gzip', 'deflate', 'br']
   */
  encodings?: string[];

  /**
   * Custom compression level
   * 0 (no compression) to 9 (maximum compression)
   * @default 6
   */
  zlibOptions?: {
    level?: number;
  };

  /**
   * Brotli compression quality
   * 0 (fastest) to 11 (best compression)
   * @default 4
   */
  brotliOptions?: {
    params?: {
      [key: number]: number;
    };
  };

  /**
   * Custom function to determine if response should be compressed
   */
  customTypes?: RegExp;

  /**
   * Remove Content-Length header when compressing
   * @default true
   */
  removeContentLengthHeader?: boolean;
}

/**
 * Register Compression plugin
 *
 * @param fastify - Fastify instance
 * @param options - Compression options
 *
 * @example
 * ```typescript
 * import { registerCompression } from 'tinyapi/plugins';
 *
 * // Enable compression with defaults
 * await registerCompression(app.getRawFastify());
 *
 * // Custom threshold and level
 * await registerCompression(app.getRawFastify(), {
 *   threshold: 2048, // Only compress responses > 2KB
 *   zlibOptions: { level: 9 }, // Maximum compression
 * });
 * ```
 */
export async function registerCompression(
  fastify: FastifyInstance,
  options: CompressionOptions = {},
): Promise<void> {
  // Guard clauses
  if (!fastify) {
    throw new Error('Fastify instance is required');
  }

  // Dynamic import to keep @fastify/compress as optional dependency
  let fastifyCompress: typeof import('@fastify/compress').default;

  try {
    fastifyCompress = (await import('@fastify/compress')).default;
  } catch (error) {
    throw new Error(
      'Compression plugin requires @fastify/compress to be installed. ' +
        'Run: pnpm add @fastify/compress',
    );
  }

  // Pass options directly - Fastify handles undefined values correctly
  await fastify.register(fastifyCompress, {
    global: options.global ?? true,
    threshold: options.threshold ?? 1024,
    removeContentLengthHeader: options.removeContentLengthHeader ?? true,
    encodings: options.encodings,
    zlibOptions: options.zlibOptions,
    brotliOptions: options.brotliOptions,
    customTypes: options.customTypes,
    // biome-ignore lint/suspicious/noExplicitAny: Thin wrapper over Fastify plugin
  } as any);
}
