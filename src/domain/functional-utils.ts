/**
 * Functional Programming Utilities for SyntroJS
 *
 * Principles:
 * - Pure functions (no side effects)
 * - Immutability
 * - Function composition
 * - Higher-order functions
 * - Currying and partial application
 */

import type { z } from 'zod';
import type { RequestContext, RouteConfig } from './types';

/**
 * PURE FUNCTIONS
 * Functions that always return the same output for the same input
 */

// Pure route creation
export const createRouteConfig = <
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
>(
  config: RouteConfig<TParams, TQuery, TBody, TResponse>,
): RouteConfig<TParams, TQuery, TBody, TResponse> => {
  return { ...config }; // Immutable copy
};

// Pure validation function
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// Pure transformation function
export const transformResponse = <T>(data: T, transformer: (data: T) => T): T => {
  return transformer(data);
};

/**
 * FUNCTION COMPOSITION
 * Combining simple functions to create complex behavior
 */

// Compose multiple validation functions
export const composeValidators = <T>(...validators: Array<(data: T) => T>) => {
  return (data: T): T => {
    return validators.reduce((acc, validator) => validator(acc), data);
  };
};

// Compose multiple transformation functions
export const composeTransformers = <T>(...transformers: Array<(data: T) => T>) => {
  return (data: T): T => {
    return transformers.reduce((acc, transformer) => transformer(acc), data);
  };
};

/**
 * HIGHER-ORDER FUNCTIONS
 * Functions that take other functions as arguments or return functions
 */

// Create a middleware function
export const createMiddleware = <T>(
  predicate: (data: T) => boolean,
  onTrue: (data: T) => T,
  onFalse: (data: T) => T,
) => {
  return (data: T): T => {
    return predicate(data) ? onTrue(data) : onFalse(data);
  };
};

// Create a conditional handler
export const createConditionalHandler = <T>(
  condition: (context: RequestContext) => boolean,
  trueHandler: (context: RequestContext) => T,
  falseHandler: (context: RequestContext) => T,
) => {
  return (context: RequestContext): T => {
    return condition(context) ? trueHandler(context) : falseHandler(context);
  };
};

/**
 * CURRYING AND PARTIAL APPLICATION
 * Breaking down functions with multiple parameters
 */

// Curried validation function
export const createValidator = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    return schema.parse(data);
  };
};

// Curried transformation function
export const createTransformer = <T, R>(transform: (data: T) => R) => {
  return (data: T): R => {
    return transform(data);
  };
};

// Partial application for route handlers
export const createRouteHandler = <TParams, TQuery, TBody, TResponse>(
  handler: (context: RequestContext) => TResponse | Promise<TResponse>,
) => {
  return (context: RequestContext): TResponse | Promise<TResponse> => {
    return handler(context);
  };
};

/**
 * IMMUTABLE DATA OPERATIONS
 * Operations that don't modify original data
 */

// Immutable object update
export const updateObject = <T extends Record<string, unknown>>(obj: T, updates: Partial<T>): T => {
  return { ...obj, ...updates };
};

// Immutable array operations
export const addToArray = <T>(array: T[], item: T): T[] => {
  return [...array, item];
};

export const removeFromArray = <T>(array: T[], predicate: (item: T) => boolean): T[] => {
  return array.filter((item) => !predicate(item));
};

export const updateArrayItem = <T>(
  array: T[],
  predicate: (item: T) => boolean,
  updater: (item: T) => T,
): T[] => {
  return array.map((item) => (predicate(item) ? updater(item) : item));
};

/**
 * FUNCTIONAL ERROR HANDLING
 * Using Either/Result pattern for error handling
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  constructor(public readonly value: T) {}

  isSuccess(): this is Success<T> {
    return true;
  }

  isFailure(): this is Failure<never> {
    return false;
  }
}

export class Failure<E> {
  constructor(public readonly error: E) {}

  isSuccess(): this is Success<never> {
    return false;
  }

  isFailure(): this is Failure<E> {
    return true;
  }
}

// Safe execution that returns Result
export const safeExecute = <T>(fn: () => T): Result<T> => {
  try {
    return new Success(fn());
  } catch (error) {
    return new Failure(error as Error);
  }
};

// Safe async execution
export const safeExecuteAsync = async <T>(fn: () => Promise<T>): Promise<Result<T>> => {
  try {
    const result = await fn();
    return new Success(result);
  } catch (error) {
    return new Failure(error as Error);
  }
};

// Map over Result
export const mapResult = <T, R, E>(result: Result<T, E>, mapper: (value: T) => R): Result<R, E> => {
  if (result.isSuccess()) {
    return new Success(mapper(result.value));
  }
  return result as Failure<E>;
};

// Chain Results
export const chainResult = <T, R, E>(
  result: Result<T, E>,
  mapper: (value: T) => Result<R, E>,
): Result<R, E> => {
  if (result.isSuccess()) {
    return mapper(result.value);
  }
  return result as Failure<E>;
};

/**
 * FUNCTIONAL ROUTE PROCESSING
 * Using functional composition for route handling
 */

// Pure route processing pipeline
export const processRoute = <TParams, TQuery, TBody, TResponse>(
  config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  context: RequestContext<TParams, TQuery, TBody>,
): Result<TResponse> => {
  // Simplified pipeline for now
  try {
    // Validate context
    if (!context) {
      throw new Error('Context is required');
    }

    // Validate schemas
    if (config.params) {
      validateData(config.params, context.params);
    }
    if (config.query) {
      validateData(config.query, context.query);
    }
    if (config.body) {
      validateData(config.body, context.body);
    }

    // Execute handler
    const result = config.handler(context);

    // Handle async results
    if (result instanceof Promise) {
      throw new Error('Async handlers not supported in sync pipeline');
    }

    return new Success(result);
  } catch (error) {
    return new Failure(error as Error);
  }
};

// Individual pipeline steps
const validateContext = (context: RequestContext): RequestContext => {
  if (!context) {
    throw new Error('Context is required');
  }
  return context;
};

const validateSchemas = <TParams, TQuery, TBody>(config: RouteConfig<TParams, TQuery, TBody>) => {
  return (context: RequestContext): RequestContext => {
    // Validate params, query, body schemas
    if (config.params) {
      validateData(config.params, context.params);
    }
    if (config.query) {
      validateData(config.query, context.query);
    }
    if (config.body) {
      validateData(config.body, context.body);
    }
    return context;
  };
};

const executeHandler = <TResponse>(
  handler: (context: RequestContext) => TResponse | Promise<TResponse>,
) => {
  return (context: RequestContext): TResponse => {
    const result = handler(context);
    // Handle async results
    if (result instanceof Promise) {
      throw new Error('Async handlers not supported in sync pipeline');
    }
    return result;
  };
};

/**
 * FUNCTIONAL UTILITIES
 * Common functional programming utilities
 */

// Pipe function for function composition
export const pipe = <T>(...fns: Array<(arg: T) => T>) => {
  return (value: T): T => {
    return fns.reduce((acc, fn) => fn(acc), value);
  };
};

// Tap function for side effects in pipelines
export const tap = <T>(fn: (value: T) => void) => {
  return (value: T): T => {
    fn(value);
    return value;
  };
};

// Memoization for expensive computations
export const memoize = <T extends (...args: unknown[]) => unknown>(fn: T): T => {
  const cache = new Map();

  return ((...args: unknown[]) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Debounce function for rate limiting
export const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;

  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
};

// Throttle function for rate limiting
export const throttle = <T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T => {
  let lastCall = 0;

  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
    return undefined;
  }) as T;
};
