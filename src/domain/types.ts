/**
 * Core types for Hyper framework
 * Domain layer - no external dependencies
 */

import type { ZodSchema } from 'zod';

/**
 * HTTP methods supported by Hyper
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * HTTP status codes
 */
export type HttpStatusCode = number;

/**
 * Generic record type for headers, query params, etc.
 */
export type StringRecord = Record<string, string>;

/**
 * Request context passed to route handlers
 */
export interface RequestContext<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  THeaders = StringRecord,
  TDependencies = Record<string, unknown>,
> {
  /** HTTP method */
  method: HttpMethod;

  /** Request path */
  path: string;

  /** Path parameters (validated) */
  params: TParams;

  /** Query parameters (validated) */
  query: TQuery;

  /** Request body (validated) */
  body: TBody;

  /** Request headers */
  headers: THeaders;

  /** Cookies */
  cookies: StringRecord;

  /** Correlation ID for tracing */
  correlationId: string;

  /** Request timestamp */
  timestamp: Date;

  /** Resolved dependencies (injected) */
  dependencies: TDependencies;

  /** Background tasks manager */
  background: {
    addTask: (task: () => void | Promise<void>, options?: {
      name?: string;
      timeout?: number;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }) => void;
  };
}

/**
 * Response returned by handlers
 */
export interface RouteResponse<TData = unknown> {
  /** Response status code */
  status: HttpStatusCode;

  /** Response body data */
  body: TData;

  /** Response headers */
  headers?: StringRecord;
}

/**
 * Route configuration schema
 */
export interface RouteConfig<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
  TDependencies = Record<string, unknown>,
> {
  /** Zod schema for path parameters */
  params?: ZodSchema<TParams>;

  /** Zod schema for query parameters */
  query?: ZodSchema<TQuery>;

  /** Zod schema for request body */
  body?: ZodSchema<TBody>;

  /** Zod schema for response validation */
  response?: ZodSchema<TResponse>;

  /** Default status code for successful responses */
  status?: HttpStatusCode;

  /** Dependency injection configuration */
  dependencies?: TDependencies;

  /** Route handler function */
  handler: RouteHandler<TParams, TQuery, TBody, TResponse, TDependencies>;

  /** OpenAPI metadata */
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  deprecated?: boolean;
}

/**
 * Route handler function type
 */
export type RouteHandler<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
  TDependencies = Record<string, unknown>,
> = (
  context: RequestContext<TParams, TQuery, TBody, StringRecord, TDependencies>,
) => TResponse | Promise<TResponse>;

/**
 * Exception handler function type
 */
export type ExceptionHandler<E extends Error = Error> = (
  context: RequestContext,
  error: E,
) => RouteResponse | Promise<RouteResponse>;

/**
 * Middleware function type
 */
export type Middleware = (context: RequestContext, next: () => Promise<void>) => Promise<void>;

/**
 * Lifecycle hook types
 */
export type OnRequestHook = (context: RequestContext) => void | Promise<void>;
export type OnResponseHook = (
  context: RequestContext,
  response: RouteResponse,
) => void | Promise<void>;
export type OnErrorHook = (context: RequestContext, error: Error) => void | Promise<void>;
