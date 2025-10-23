/**
 * TinyApi Plugins
 *
 * Optional plugins for common use cases
 * All plugins are wrappers around Fastify plugins
 */

export { registerCors, type CorsOptions } from './cors';
export { registerHelmet, type HelmetOptions } from './helmet';
export { registerCompression, type CompressionOptions } from './compression';
export { registerRateLimit, type RateLimitOptions } from './rateLimit';
