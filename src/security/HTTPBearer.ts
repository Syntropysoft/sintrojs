/**
 * HTTPBearer
 * Generic HTTP Bearer token authentication
 */

import { HTTPException } from '../domain/HTTPException';

/**
 * Generic request interface for security modules
 */
export interface SecurityRequest {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
}

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
   * @param request - Request object with headers
   * @returns Bearer token string
   * @throws HTTPException 401 if token is missing or invalid format
   */
  async validate(request: SecurityRequest): Promise<string> {
    const authHeader = request.headers.authorization;

    // Guard: Missing Authorization header
    if (!authHeader) {
      throw new HTTPException(401, 'Not authenticated', { 'WWW-Authenticate': 'Bearer' });
    }

    // Convert to string if array
    const authHeaderStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    // Guard: Invalid format
    if (!authHeaderStr?.startsWith('Bearer ')) {
      throw new HTTPException(401, 'Invalid authentication credentials', {
        'WWW-Authenticate': 'Bearer',
      });
    }

    // Extract token
    const token = authHeaderStr.slice(7).trim(); // Remove 'Bearer ' prefix

    // Guard: Empty token
    if (token === '') {
      throw new HTTPException(401, 'Invalid authentication credentials', {
        'WWW-Authenticate': 'Bearer',
      });
    }

    return token;
  }
}
