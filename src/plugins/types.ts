/**
 * Plugin configuration types for SyntroJS
 */

export interface CorsOptions {
  origin?: string | string[];
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  strict?: boolean;
}

export interface SecurityOptions {
  strict?: boolean;
  contentSecurityPolicy?: any;
}

export interface CompressionOptions {
  threshold?: number;
  zlibOptions?: any;
}

export interface RateLimitOptions {
  max?: number;
  timeWindow?: string;
  addHeaders?: any;
}
