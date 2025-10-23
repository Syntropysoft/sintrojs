/**
 * HTTPBearer
 * Generic HTTP Bearer token authentication
 */

import type { FastifyRequest } from 'fastify';
import { HTTPException } from '../domain/HTTPException';

/**
 * HTTP Bearer authentication (generic)
 * Extracts Bearer token from Authorization header
 *
 * Similar to OAuth2PasswordBearer but without OAuth2-specific metadata
 *
 * @example
 * ```typescript
 * const bearer = new HTTPBearer();
 *
 * app.get('/protected', {
 *   dependencies: { token: inject(async (req) => bearer.validate(req)) },
 *   handler: ({ dependencies }) => {
 *     // dependencies.token is the validated Bearer token
 *     return { message: 'Protected resource' };
 *   }
 * });
 * ```
 */
export class HTTPBearer {
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
