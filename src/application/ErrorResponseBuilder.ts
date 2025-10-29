/**
 * Error Response Builder
 *
 * Responsibility: Build error responses based on error types
 * Pattern: Strategy Pattern (Dictionary-based)
 * Principles: SOLID (Single Responsibility), Functional Programming
 */

import type { RequestContext, RouteResponse } from '../domain/types';

/**
 * Error message predicate function
 */
type ErrorMessagePredicate = (message: string) => boolean;

/**
 * Error response configuration
 */
interface ErrorResponseConfig {
  status: number;
  headers?: Record<string, string>;
  detail: string;
  message?: string | ((error: Error) => string);
}

/**
 * Security error pattern configuration
 * Strategy Pattern: Dictionary replaces if/switch chains
 */
const SECURITY_ERROR_PATTERNS: Readonly<
  Array<{
    predicate: ErrorMessagePredicate;
    config: ErrorResponseConfig;
  }>
> = Object.freeze([
  {
    predicate: (message: string) =>
      message.includes('JWT token is required') || message.includes('INVALID_TOKEN'),
    config: {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' },
      detail: 'Authentication required',
      message: (error: Error) => error.message,
    },
  },
  {
    predicate: (message: string) =>
      message.includes('Cannot destructure property') && message.includes('credentials'),
    config: {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic' },
      detail: 'Authentication required',
      message: 'Missing authentication credentials',
    },
  },
]);

/**
 * Production environment check
 * Pure function: determines if we're in production
 *
 * @returns true if in production
 */
function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

/**
 * Builds error response for generic Error instances
 * Pure function: no side effects, deterministic
 *
 * @param error - Error instance
 * @param context - Request context
 * @returns Error response
 */
export function buildGenericErrorResponse(error: Error, context: RequestContext): RouteResponse {
  // Guard clause: validate error
  if (!error) {
    throw new Error('Error is required');
  }

  // Functional approach: find matching pattern
  const matchingPattern = SECURITY_ERROR_PATTERNS.find((pattern) =>
    pattern.predicate(error.message),
  );

  // If pattern matches, use configured response
  if (matchingPattern) {
    const config = matchingPattern.config;
    const message =
      typeof config.message === 'function'
        ? config.message(error)
        : (config.message ?? error.message);

    return {
      status: config.status,
      headers: config.headers,
      body: {
        detail: config.detail,
        message,
        path: context.path,
      },
    };
  }

  // Default error response (functional approach)
  return {
    status: 500,
    body: {
      detail: isProduction() ? 'Internal Server Error' : error.message,
      path: context.path,
    },
  };
}

/**
 * Builds error response for unhandled errors with logging
 * Pure function: builds response deterministically
 *
 * @param error - Error instance
 * @param context - Request context
 * @returns Error response
 */
export function buildUnhandledErrorResponse(error: Error, context: RequestContext): RouteResponse {
  // Guard clause: validate error
  if (!error) {
    throw new Error('Error is required');
  }

  // Functional approach: build response immutably
  return {
    status: 500,
    body: {
      detail: isProduction() ? 'Internal Server Error' : error.message,
      path: context.path,
    },
  };
}
