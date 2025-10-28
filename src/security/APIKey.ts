/**
 * API Key authentication (Header, Cookie, Query)
 */

import { HTTPException } from '../domain/HTTPException';

/**
 * Generic request interface for security modules
 */
export interface SecurityRequest {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
}

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
   * @param request - Request object with headers
   * @returns API key string
   * @throws HTTPException 403 if API key is missing
   */
  async validate(request: SecurityRequest): Promise<string> {
    // Header names are case-insensitive in HTTP
    const headerName = this.name.toLowerCase();
    const apiKey = request.headers[headerName];

    // Guard: Missing API key
    if (!apiKey) {
      throw new HTTPException(403, 'Not authenticated');
    }

    // Convert to string if array
    const apiKeyStr = Array.isArray(apiKey) ? apiKey[0] : apiKey;

    // Guard: Empty API key
    if (!apiKeyStr || apiKeyStr.trim() === '') {
      throw new HTTPException(403, 'Not authenticated');
    }

    return apiKeyStr.trim();
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
   * @param request - Request object with cookies
   * @returns API key string
   * @throws HTTPException 403 if API key is missing
   */
  async validate(request: SecurityRequest): Promise<string> {
    const apiKey = request.cookies?.[this.name];

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
  async validate(request: SecurityRequest): Promise<string> {
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
