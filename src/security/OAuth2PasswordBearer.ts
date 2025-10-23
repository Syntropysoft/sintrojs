/**
 * OAuth2PasswordBearer
 * Extracts and validates OAuth2 Bearer tokens from Authorization header
 */

import type { FastifyRequest } from 'fastify';
import { HTTPException } from '../domain/HTTPException';

/**
 * OAuth2 Password Bearer authentication
 * Extracts Bearer token from Authorization header
 *
 * @example
 * ```typescript
 * const oauth2 = new OAuth2PasswordBearer('/token');
 *
 * app.get('/protected', {
 *   dependencies: { token: inject(async (req) => oauth2.validate(req)) },
 *   handler: ({ dependencies }) => {
 *     // dependencies.token is the validated Bearer token
 *     return { message: 'Protected resource' };
 *   }
 * });
 * ```
 */
export class OAuth2PasswordBearer {
  /**
   * @param tokenUrl - URL where clients can obtain tokens (used for OpenAPI docs)
   * @param scopes - Optional OAuth2 scopes (used for OpenAPI docs)
   */
  constructor(
    public readonly tokenUrl: string,
    public readonly scopes?: Record<string, string>,
  ) {
    // Guard: Empty tokenUrl
    if (!tokenUrl || tokenUrl.trim() === '') {
      throw new Error('tokenUrl is required');
    }
  }

  /**
   * Validate and extract Bearer token from Authorization header
   *
   * @param request - Fastify request
   * @returns Bearer token string
   * @throws HTTPException 401 if token is missing or invalid format
   */
  async validate(request: FastifyRequest): Promise<string> {
    const authHeader = request.headers.authorization;

    // Guard: Missing Authorization header
    if (!authHeader) {
      throw new HTTPException(401, 'Not authenticated', { 'WWW-Authenticate': 'Bearer' });
    }

    // Guard: Invalid format
    if (!authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, 'Invalid authentication credentials', {
        'WWW-Authenticate': 'Bearer',
      });
    }

    // Extract token
    const token = authHeader.slice(7).trim(); // Remove 'Bearer ' prefix

    // Guard: Empty token
    if (token === '') {
      throw new HTTPException(401, 'Invalid authentication credentials', {
        'WWW-Authenticate': 'Bearer',
      });
    }

    return token;
  }
}
