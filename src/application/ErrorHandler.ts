/**
 * ErrorHandler - Application Service
 *
 * Responsibility: Handle exceptions and convert to HTTP responses
 * Pattern: Singleton (Module Pattern)
 * Principles: SOLID (Single Responsibility), Guard Clauses, Functional
 */

import { HTTPException, ValidationException } from '../domain/HTTPException';
import type { ExceptionHandler, RequestContext, RouteResponse } from '../domain/types';
import { z } from 'zod';

/**
 * Error handler implementation
 */
class ErrorHandlerImpl {
  // Immutable: Map is never replaced
  private readonly handlers = new Map<new (...args: any[]) => Error, ExceptionHandler>();

  constructor() {
    // Register default handlers on initialization
    this.registerDefaultHandlers();
  }

  /**
   * Registers a custom exception handler
   *
   * @param errorClass - Error class constructor
   * @param handler - Handler function
   */
  register<E extends Error>(
    errorClass: new (...args: any[]) => E,
    handler: ExceptionHandler<E>,
  ): void {
    // Guard clauses
    if (!errorClass) {
      throw new Error('Error class is required');
    }

    if (!handler) {
      throw new Error('Handler function is required');
    }

    // Happy path
    this.handlers.set(errorClass, handler as ExceptionHandler);
  }

  /**
   * Handles an error and converts it to HTTP response
   *
   * @param error - Error to handle
   * @param context - Request context
   * @returns HTTP response
   */
  async handle(error: Error, context: RequestContext): Promise<RouteResponse> {
    // Guard clauses
    if (!error) {
      throw new Error('Error is required');
    }

    if (!context) {
      throw new Error('Context is required');
    }

    // Try to find specific handler for error class
    const handler = this.findHandler(error);

    if (handler) {
      return handler(context, error);
    }

    // Fallback: use generic error handler
    return this.handleGenericError(error, context);
  }

  /**
   * Finds the appropriate handler for an error
   *
   * Pure function: searches for handler without side effects
   * Finds the MOST SPECIFIC handler in the inheritance chain
   *
   * @param error - Error instance
   * @returns Handler if found, undefined otherwise
   */
  private findHandler(error: Error): ExceptionHandler | undefined {
    // Check exact class match first (most specific)
    const exactHandler = this.handlers.get(error.constructor as any);
    if (exactHandler) {
      return exactHandler;
    }

    // Find all matching handlers in inheritance chain
    const matches: Array<{ errorClass: new (...args: any[]) => Error; handler: ExceptionHandler }> =
      [];

    for (const [errorClass, handler] of this.handlers.entries()) {
      if (error instanceof errorClass) {
        matches.push({ errorClass, handler });
      }
    }

    // If no matches, return undefined
    if (matches.length === 0) {
      return undefined;
    }

    // If only one match, return it
    if (matches.length === 1) {
      return matches[0]?.handler;
    }

    // Multiple matches: find most specific (closest in prototype chain)
    // Sort by specificity: child class instances are also instances of parent
    // The most specific is the one that extends the others
    let mostSpecific = matches[0];

    if (!mostSpecific) {
      return undefined;
    }

    for (let i = 1; i < matches.length; i++) {
      const current = matches[i];

      if (!current) {
        continue;
      }

      // If current extends mostSpecific, current is more specific
      if (
        Object.prototype.isPrototypeOf.call(
          mostSpecific.errorClass.prototype,
          current.errorClass.prototype,
        )
      ) {
        mostSpecific = current;
      }
    }

    return mostSpecific.handler;
  }

  /**
   * Registers default exception handlers
   * Called on initialization
   */
  private registerDefaultHandlers(): void {
    // HTTPException handler
    this.register(HTTPException, (context, error) => {
      const httpError = error as HTTPException;

      return {
        status: httpError.statusCode,
        body: {
          detail: httpError.detail,
          path: context.path,
        },
        headers: httpError.headers,
      };
    });

    // ValidationException handler (422)
    this.register(ValidationException, (context, error) => {
      const validationError = error as ValidationException;

      return {
        status: 422,
        body: {
          detail: validationError.detail,
          errors: validationError.errors,
          path: context.path,
        },
      };
    });

    // ZodError handler (422) - Convert ZodError to ValidationException format
    this.register(z.ZodError, (context, error) => {
      const zodError = error as z.ZodError;

      return {
        status: 422,
        body: {
          detail: 'Validation Error',
          errors: zodError.errors.map(err => ({
            field: err.path.join('.'),
            ...err
          })),
          path: context.path,
        },
      };
    });

    // JWTError handler (401) - Convert JWTError to HTTPException format
    this.register(Error, (context, error) => {
      const err = error as Error;
      
      // Check if it's a JWT error
      if (err.message.includes('JWT token is required') || err.message.includes('INVALID_TOKEN')) {
        return {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer'
          },
          body: {
            detail: 'Authentication required',
            message: err.message,
            path: context.path,
          },
        };
      }
      
      // Check if it's a security error (missing credentials)
      if (err.message.includes('Cannot destructure property') && err.message.includes('credentials')) {
        return {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic'
          },
          body: {
            detail: 'Authentication required',
            message: 'Missing authentication credentials',
            path: context.path,
          },
        };
      }
      
      // Default error handling
      return {
        status: 500,
        body: {
          detail: 'Internal Server Error',
          message: err.message,
          path: context.path,
        },
      };
    });

    // Generic Error handler (500)
    this.register(Error, (context, error) => {
      // Log error for debugging
      console.error('Unhandled error:', error);

      const isProduction = process.env['NODE_ENV'] === 'production';
      return {
        status: 500,
        body: {
          detail: isProduction ? 'Internal Server Error' : error.message,
          path: context.path,
        },
      };
    });
  }

  /**
   * Handles generic errors not matched by specific handlers
   *
   * @param error - Error instance
   * @param context - Request context
   * @returns Generic 500 response
   */
  private handleGenericError(error: Error, context: RequestContext): RouteResponse {
    console.error('Unhandled error:', error);

    const isProduction = process.env['NODE_ENV'] === 'production';
    return {
      status: 500,
      body: {
        detail: isProduction ? 'Internal Server Error' : error.message,
        path: context.path,
      },
    };
  }

  /**
   * Checks if a handler is registered for an error class
   *
   * @param errorClass - Error class to check
   * @returns true if handler exists
   */
  hasHandler(errorClass: new (...args: any[]) => Error): boolean {
    // Guard clause
    if (!errorClass) {
      throw new Error('Error class is required');
    }

    return this.handlers.has(errorClass);
  }

  /**
   * Gets all registered error classes
   *
   * @returns Immutable array of error classes
   */
  getRegisteredErrorClasses(): ReadonlyArray<new (...args: any[]) => Error> {
    return [...this.handlers.keys()];
  }

  /**
   * Clears all custom handlers (keeps defaults)
   * Useful for testing
   */
  clearCustomHandlers(): void {
    this.handlers.clear();
    this.registerDefaultHandlers();
  }
}

/**
 * Exported singleton (Module Pattern)
 */
export const ErrorHandler = new ErrorHandlerImpl();

/**
 * Factory for testing
 */
export const createErrorHandler = (): ErrorHandlerImpl => new ErrorHandlerImpl();
