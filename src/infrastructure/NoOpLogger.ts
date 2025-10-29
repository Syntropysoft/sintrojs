/**
 * No-Op Logger Factory
 *
 * Responsibility: Create no-op logger instances
 * Pattern: Factory Pattern
 * Principles: SOLID (Single Responsibility), Functional Programming
 */

import type { Logger } from '@syntrojs/logger';

/**
 * Creates a no-op logger that discards all log operations
 *
 * @returns No-op logger instance
 */
export function createNoOpLogger(): Logger {
  const noOpLogger = {
    trace: () => noOpLogger,
    debug: () => noOpLogger,
    info: () => noOpLogger,
    warn: () => noOpLogger,
    error: () => noOpLogger,
    fatal: () => noOpLogger,
    withTransactionId: () => noOpLogger,
    withSource: () => noOpLogger,
    withMetadata: () => noOpLogger,
    child: () => noOpLogger,
    withoutContext: () => noOpLogger,
    name: 'no-op',
    level: 'silent' as const,
  } as unknown as Logger;

  return noOpLogger;
}
