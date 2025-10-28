/**
 * Route Entity
 * Domain representation of an API route
 */

import type { HttpMethod, RouteConfig, RouteHandler } from './types';

/**
 * Route entity representing a single API endpoint
 */
export class Route<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
  TDependencies = Record<string, unknown>,
> {
  public readonly method: HttpMethod;
  public readonly path: string;
  public readonly config: RouteConfig<TParams, TQuery, TBody, TResponse, TDependencies>;
  public readonly handler: RouteHandler<TParams, TQuery, TBody, TResponse, TDependencies>;

  constructor(
    method: HttpMethod,
    path: string,
    config: RouteConfig<TParams, TQuery, TBody, TResponse, TDependencies>,
  ) {
    // Guard clauses
    if (!method) {
      throw new Error('Route method is required');
    }

    if (!path) {
      throw new Error('Route path is required');
    }

    if (!config) {
      throw new Error('Route config is required');
    }

    if (!config.handler) {
      throw new Error('Route handler is required');
    }

    // Validate path format
    if (!path.startsWith('/')) {
      throw new Error('Route path must start with /');
    }

    this.method = method;
    this.path = path;
    this.config = config;
    this.handler = config.handler;
  }

  /**
   * Get unique route identifier
   */
  get id(): string {
    return `${this.method}:${this.path}`;
  }
}
