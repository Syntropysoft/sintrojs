/**
 * TinyApi Plugins
 *
 * Optional plugins for common use cases
 * All plugins are wrappers around Fastify plugins
 */

export { registerCors } from './cors';
export { registerHelmet } from './helmet';
export { registerCompression } from './compression';
export { registerRateLimit } from './rateLimit';

// Export unified types
export type { CorsOptions, SecurityOptions, CompressionOptions, RateLimitOptions } from './types';
