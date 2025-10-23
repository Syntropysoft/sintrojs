/**
 * API Key authentication (Header, Cookie, Query)
 */

import type { FastifyRequest } from 'fastify';
import { HTTPException } from '../domain/HTTPException';

/**
 * API Key authentication via HTTP Header
 *
 * @example
 * ```typescript
 * const apiKeyHeader = new APIKeyHeader('X-API-Key');
 *
 * app.get('/protected', {
 *   dependencies: { apiKey: inject(async (req) => apiKeyHeader.validate(req)) },
 *   handler: ({ dependencies }) => {
 *     // Verify apiKey against database
 *     return { message: 'Authenticated' };
 *   }
 * });
 * ```
 */
export class APIKeyHeader {
  /**
   * @param name - Header name (default: 'X-API-Key')
   */
  constructor(public readonly name: string = 'X-API-Key') {
    // Guard: Empty name
    if (!name || name.trim() === '') {
      throw new Error('Header name is required');
    }
  }

  /**
   * Validate and extract API key from header
   *
   * @param request - Fastify request
   * @returns API key string
   * @throws HTTPException 403 if API key is missing
   */
  async validate(request: FastifyRequest): Promise<string> {
    // Header names are case-insensitive in HTTP
    const headerName = this.name.toLowerCase();
    const apiKey = request.headers[headerName] as string | undefined;

    // Guard: Missing API key
    if (!apiKey) {
      throw new HTTPException(403, 'Not authenticated');
    }

    // Guard: Empty API key
    if (apiKey.trim() === '') {
      throw new HTTPException(403, 'Not authenticated');
    }

    return apiKey.trim();
  }
}

/**
 * API Key authentication via Cookie
 *
 * @example
 * ```typescript
 * const apiKeyCookie = new APIKeyCookie('api_key');
 *
 * app.get('/protected', {
 *   dependencies: { apiKey: inject(async (req) => apiKeyCookie.validate(req)) },
 *   handler: ({ dependencies }) => {
 *     // Verify apiKey against database
 *     return { message: 'Authenticated' };
 *   }
 * });
 * ```
 */
export class APIKeyCookie {
  /**
   * @param name - Cookie name
   */
  constructor(public readonly name: string) {
    // Guard: Empty name
    if (!name || name.trim() === '') {
      throw new Error('Cookie name is required');
    }
  }

  /**
   * Validate and extract API key from cookie
   *
   * @param request - Fastify request
   * @returns API key string
   * @throws HTTPException 403 if API key is missing
   */
  async validate(request: FastifyRequest): Promise<string> {
    // Get cookie (Fastify parses cookies automatically if @fastify/cookie is registered)
    // biome-ignore lint/suspicious/noExplicitAny: Fastify cookies plugin extends request
    const apiKey = (request as any).cookies?.[this.name];

    // Guard: Missing API key
    if (!apiKey) {
      throw new HTTPException(403, 'Not authenticated');
    }

    // Guard: Empty API key
    if (apiKey.trim() === '') {
      throw new HTTPException(403, 'Not authenticated');
    }

    return apiKey.trim();
  }
}

/**
 * API Key authentication via Query Parameter
 *
 * @example
 * ```typescript
 * const apiKeyQuery = new APIKeyQuery('api_key');
 *
 * app.get('/protected', {
 *   dependencies: { apiKey: inject(async (req) => apiKeyQuery.validate(req)) },
 *   handler: ({ dependencies }) => {
 *     // Verify apiKey against database
 *     return { message: 'Authenticated' };
 *   }
 * });
 *
 * // Usage: GET /protected?api_key=my-secret-key
 * ```
 */
export class APIKeyQuery {
  /**
   * @param name - Query parameter name
   */
  constructor(public readonly name: string) {
    // Guard: Empty name
    if (!name || name.trim() === '') {
      throw new Error('Query parameter name is required');
    }
  }

  /**
   * Validate and extract API key from query parameter
   *
   * @param request - Fastify request
   * @returns API key string
   * @throws HTTPException 403 if API key is missing
   */
  async validate(request: FastifyRequest): Promise<string> {
    // Get query parameter
    const query = request.query as Record<string, string | undefined>;
    const apiKey = query[this.name];

    // Guard: Missing API key
    if (!apiKey) {
      throw new HTTPException(403, 'Not authenticated');
    }

    // Guard: Empty API key
    if (apiKey.trim() === '') {
      throw new HTTPException(403, 'Not authenticated');
    }

    return apiKey.trim();
  }
}
