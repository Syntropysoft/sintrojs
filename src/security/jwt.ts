/**
 * JWT Utilities
 * Simple, functional JWT sign/verify/decode utilities
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  /** Subject (user ID, etc.) */
  sub?: string;
  /** Expiration time (Unix timestamp) */
  exp?: number;
  /** Issued at (Unix timestamp) */
  iat?: number;
  /** Issuer */
  iss?: string;
  /** Audience */
  aud?: string;
  /** Custom claims */
  [key: string]: unknown;
}

/**
 * JWT Options for signing
 */
export interface JWTSignOptions {
  /** Secret key for signing */
  secret: string;
  /** Expiration time (e.g., "1h", "7d", "30m") */
  expiresIn?: string;
  /** Issuer */
  issuer?: string;
  /** Audience */
  audience?: string;
}

/**
 * JWT Verify Options
 */
export interface JWTVerifyOptions {
  /** Secret key for verification */
  secret: string;
  /** Expected issuer */
  issuer?: string;
  /** Expected audience */
  audience?: string;
}

/**
 * JWT Error
 */
export class JWTError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'INVALID_SIGNATURE' | 'INVALID_FORMAT',
  ) {
    super(message);
    this.name = 'JWTError';
  }
}

// ============================================
// Internal Helpers
// ============================================

/**
 * Base64 URL encode (RFC 4648)
 */
function base64UrlEncode(data: string): string {
  return Buffer.from(data, 'utf8').toString('base64url');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}

/**
 * Parse expiration time string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  // Guard: Empty string
  if (!expiresIn || expiresIn.trim() === '') {
    throw new Error('expiresIn cannot be empty');
  }

  const match = expiresIn.match(/^(\d+)([smhd])$/);

  // Guard: Invalid format
  if (!match || !match[1] || !match[2]) {
    throw new Error('Invalid expiresIn format. Use format like "1h", "30m", "7d"');
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  const multiplier = multipliers[unit];
  if (multiplier === undefined) {
    throw new Error('Invalid time unit');
  }

  return value * multiplier;
}

/**
 * Create HMAC signature
 */
function createSignature(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

/**
 * Verify HMAC signature (timing-safe comparison)
 */
function verifySignature(data: string, signature: string, secret: string): boolean {
  const expectedSignature = createSignature(data, secret);

  // Guard: Length mismatch
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  // Timing-safe comparison
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// ============================================
// Public API
// ============================================

/**
 * Sign a JWT token
 *
 * @param payload - JWT payload
 * @param options - Sign options
 * @returns JWT token string
 *
 * @example
 * ```typescript
 * const token = signJWT(
 *   { sub: 'user123', role: 'admin' },
 *   { secret: 'my-secret', expiresIn: '1h' }
 * );
 * ```
 */
export function signJWT(payload: JWTPayload, options: JWTSignOptions): string {
  // Guard: Invalid secret
  if (!options.secret || options.secret.trim() === '') {
    throw new Error('JWT secret is required');
  }

  // Guard: Invalid payload
  if (!payload || typeof payload !== 'object') {
    throw new Error('JWT payload must be an object');
  }

  // Guard: Invalid expiresIn (empty string check)
  if (options.expiresIn !== undefined && options.expiresIn.trim() === '') {
    throw new Error('expiresIn cannot be empty');
  }

  const now = Math.floor(Date.now() / 1000);

  // Build claims
  const claims: JWTPayload = {
    ...payload,
    iat: now,
  };

  // Add expiration
  if (options.expiresIn) {
    const expiresInSeconds = parseExpiresIn(options.expiresIn);
    claims.exp = now + expiresInSeconds;
  }

  // Add issuer
  if (options.issuer) {
    claims.iss = options.issuer;
  }

  // Add audience
  if (options.audience) {
    claims.aud = options.audience;
  }

  // Create JWT header
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));

  // Create signature
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = createSignature(dataToSign, options.secret);

  // Return JWT
  return `${dataToSign}.${signature}`;
}

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT token string
 * @param options - Verify options
 * @returns Decoded payload
 * @throws JWTError if token is invalid
 *
 * @example
 * ```typescript
 * try {
 *   const payload = verifyJWT(token, { secret: 'my-secret' });
 *   console.log(payload.sub); // 'user123'
 * } catch (error) {
 *   if (error instanceof JWTError) {
 *     console.error(error.code); // 'EXPIRED_TOKEN', 'INVALID_SIGNATURE', etc.
 *   }
 * }
 * ```
 */
export function verifyJWT(token: string, options: JWTVerifyOptions): JWTPayload {
  // Guard: Empty token
  if (!token || token.trim() === '') {
    throw new JWTError('JWT token is required', 'INVALID_TOKEN');
  }

  // Guard: Invalid secret
  if (!options.secret || options.secret.trim() === '') {
    throw new JWTError('JWT secret is required', 'INVALID_TOKEN');
  }

  // Parse token
  const parts = token.split('.');

  // Guard: Invalid format
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new JWTError('Invalid JWT format. Expected 3 parts separated by dots', 'INVALID_FORMAT');
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify signature
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;
  if (!verifySignature(dataToVerify, signature, options.secret)) {
    throw new JWTError('Invalid JWT signature', 'INVALID_SIGNATURE');
  }

  // Decode payload
  let payload: JWTPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    throw new JWTError('Invalid JWT payload (not valid JSON)', 'INVALID_FORMAT');
  }

  // Check expiration
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) {
      throw new JWTError('JWT token has expired', 'EXPIRED_TOKEN');
    }
  }

  // Check issuer
  if (options.issuer && payload.iss !== options.issuer) {
    throw new JWTError(
      `Invalid issuer. Expected "${options.issuer}", got "${payload.iss}"`,
      'INVALID_TOKEN',
    );
  }

  // Check audience
  if (options.audience && payload.aud !== options.audience) {
    throw new JWTError(
      `Invalid audience. Expected "${options.audience}", got "${payload.aud}"`,
      'INVALID_TOKEN',
    );
  }

  return payload;
}

/**
 * Decode a JWT token WITHOUT verification
 *
 * ⚠️ WARNING: This does NOT verify the signature. Only use for debugging/inspection.
 *
 * @param token - JWT token string
 * @returns Decoded payload (unverified)
 * @throws JWTError if token format is invalid
 *
 * @example
 * ```typescript
 * const payload = decodeJWT(token);
 * console.log(payload.sub); // Unverified!
 * ```
 */
export function decodeJWT(token: string): JWTPayload {
  // Guard: Empty token
  if (!token || token.trim() === '') {
    throw new JWTError('JWT token is required', 'INVALID_TOKEN');
  }

  // Parse token
  const parts = token.split('.');

  // Guard: Invalid format
  if (parts.length !== 3 || !parts[1]) {
    throw new JWTError('Invalid JWT format. Expected 3 parts separated by dots', 'INVALID_FORMAT');
  }

  const encodedPayload = parts[1];

  // Decode payload (no verification)
  try {
    return JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    throw new JWTError('Invalid JWT payload (not valid JSON)', 'INVALID_FORMAT');
  }
}
