/**
 * Error Extractor
 *
 * Responsibility: Extract error information safely for logging
 * Pattern: Utility Functions (Pure Functions)
 * Principles: SOLID (Single Responsibility), Functional Programming
 */

/**
 * Error information structure for logging
 */
export interface LoggerErrorInfo {
  name: string;
  message: string;
  stack?: string;
}

/**
 * Extracts error information from unknown error type for logging purposes
 * Pure function: no side effects, handles any error type safely
 *
 * @param error - Error of unknown type
 * @returns Structured error information for logging
 */
export function extractLoggerErrorInfo(error: unknown): LoggerErrorInfo {
  // Guard clause: handle null/undefined
  if (!error) {
    return {
      name: 'Unknown',
      message: 'Unknown error',
    };
  }

  // Guard clause: handle Error instances
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  // Guard clause: handle string errors
  if (typeof error === 'string') {
    return {
      name: 'StringError',
      message: error,
    };
  }

  // Guard clause: handle objects with error-like properties
  if (typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    return {
      name: typeof errorObj.name === 'string' ? errorObj.name : 'ObjectError',
      message:
        typeof errorObj.message === 'string'
          ? errorObj.message
          : typeof errorObj.toString === 'function'
            ? errorObj.toString()
            : 'Unknown error object',
      stack: typeof errorObj.stack === 'string' ? errorObj.stack : undefined,
    };
  }

  // Fallback: convert to string
  return {
    name: 'Unknown',
    message: String(error),
  };
}
