/**
 * Log Level Mapper
 *
 * Responsibility: Map HTTP status codes to log levels
 * Pattern: Strategy Pattern (Dictionary-based)
 * Principles: SOLID (Open/Closed), Functional Programming
 */

import type { LogLevel } from '@syntrojs/logger';

/**
 * HTTP status code range to log level mapping
 * Strategy Pattern: Dictionary replaces ternary/switch
 */
const STATUS_CODE_TO_LOG_LEVEL: Readonly<
  Array<{ predicate: (statusCode: number) => boolean; level: LogLevel }>
> = Object.freeze([
  { predicate: (statusCode: number) => statusCode >= 500, level: 'error' as const },
  { predicate: (statusCode: number) => statusCode >= 400, level: 'warn' as const },
  { predicate: () => true, level: 'info' as const }, // Default case
]);

/**
 * Maps HTTP status code to appropriate log level
 * Pure function: no side effects, deterministic
 *
 * @param statusCode - HTTP status code
 * @returns Log level
 */
export function getLogLevelForStatusCode(statusCode: number): LogLevel {
  // Guard clause: validate status code
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    return 'info';
  }

  // Functional approach: find first matching predicate
  const mapping = STATUS_CODE_TO_LOG_LEVEL.find((item) => item.predicate(statusCode));

  // Guard clause: ensure we always return a level (fallback to info)
  return mapping?.level ?? 'info';
}
