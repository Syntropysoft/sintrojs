/**
 * HTTPBasic
 * HTTP Basic authentication
 */

import type { FastifyRequest } from 'fastify';
import { HTTPException } from '../domain/HTTPException';

/**
 * HTTP Basic authentication credentials
 */
export interface HTTPBasicCredentials {
  username: string;
  password: string;
}

/**
 * HTTP Basic authentication
 * Extracts and decodes credentials from Authorization header
 *
 * @example
 * ```typescript
 * const basic = new HTTPBasic();
 *
 * app.get('/protected', {
 *   dependencies: { credentials: inject(async (req) => basic.validate(req)) },
 *   handler: ({ dependencies }) => {
 *     const { username, password } = dependencies.credentials;
 *     // Verify credentials against database
 *     return { message: `Hello, ${username}` };
 *   }
 * });
 * ```
 */
export class HTTPBasic {
  /**
   * Validate and extract Basic auth credentials from Authorization header
   *
   * @param request - Fastify request
   * @returns Decoded credentials (username and password)
   * @throws HTTPException 401 if credentials are missing or invalid format
   */
  async validate(request: FastifyRequest): Promise<HTTPBasicCredentials> {
    const authHeader = request.headers.authorization;

    // Guard: Missing Authorization header
    if (!authHeader) {
      throw new HTTPException(401, 'Not authenticated', { 'WWW-Authenticate': 'Basic' });
    }

    // Guard: Invalid format
    if (!authHeader.startsWith('Basic ')) {
      throw new HTTPException(401, 'Invalid authentication credentials', { 'WWW-Authenticate': 'Basic' });
    }

    // Extract base64 credentials
    const base64Credentials = authHeader.slice(6).trim(); // Remove 'Basic ' prefix

    // Guard: Empty credentials
    if (base64Credentials === '') {
      throw new HTTPException(401, 'Invalid authentication credentials', { 'WWW-Authenticate': 'Basic' });
    }

    // Decode credentials
    let credentials: string;
    try {
      credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    } catch {
      throw new HTTPException(401, 'Invalid authentication credentials', { 'WWW-Authenticate': 'Basic' });
    }

    // Parse username:password
    const colonIndex = credentials.indexOf(':');

    // Guard: Invalid format (no colon)
    if (colonIndex === -1) {
      throw new HTTPException(401, 'Invalid authentication credentials', { 'WWW-Authenticate': 'Basic' });
    }

    const username = credentials.slice(0, colonIndex);
    const password = credentials.slice(colonIndex + 1);

    // Guard: Empty username
    if (username === '') {
      throw new HTTPException(401, 'Invalid authentication credentials', { 'WWW-Authenticate': 'Basic' });
    }

    return { username, password };
  }
}

