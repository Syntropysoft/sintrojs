/**
 * RouteRegistry - Application Service
 *
 * Responsibility: Register and manage application routes
 * Pattern: Singleton (Module Pattern)
 * Principles: SOLID (Single Responsibility), Guard Clauses, Immutability
 */

import type { Route } from '../domain/Route';
import type { HttpMethod } from '../domain/types';

/**
 * Route registry implementation
 */
class RouteRegistryImpl {
  // Immutable: Map is never replaced, only its entries are modified
  // biome-ignore lint/suspicious/noExplicitAny: Route can have any generic types
  private readonly routes = new Map<string, Route<any, any, any, any>>();

  /**
   * Registers a new route
   *
   * @param route - Route to register
   * @throws Error if route already exists
   */
  register(route: Route<any, any, any, any>): void {
    // Guard clause: validate route exists
    if (!route) {
      throw new Error('Route is required');
    }

    const routeId = route.id;

    // Guard clause: validate no duplicate
    if (this.routes.has(routeId)) {
      throw new Error(`Route ${routeId} is already registered`);
    }

    // Happy path at the end
    this.routes.set(routeId, route);
  }

  /**
   * Gets a route by method and path
   *
   * @param method - HTTP method
   * @param path - Route path
   * @returns Route if exists, undefined otherwise
   */
  get(method: HttpMethod, path: string): Route<any, any, any, any> | undefined {
    // Guard clauses
    if (!method) {
      throw new Error('Method is required');
    }

    if (!path) {
      throw new Error('Path is required');
    }

    // Happy path
    const routeId = `${method}:${path}`;
    return this.routes.get(routeId);
  }

  /**
   * Checks if a route exists
   *
   * @param method - HTTP method
   * @param path - Route path
   * @returns true if exists, false otherwise
   */
  has(method: HttpMethod, path: string): boolean {
    // Guard clauses
    if (!method) {
      throw new Error('Method is required');
    }

    if (!path) {
      throw new Error('Path is required');
    }

    // Happy path
    const routeId = `${method}:${path}`;
    return this.routes.has(routeId);
  }

  /**
   * Gets all registered routes
   *
   * @returns Immutable array of routes
   */
  getAll(): ReadonlyArray<Route<any, any, any, any>> {
    // Return immutable array (spread creates new copy)
    return [...this.routes.values()];
  }

  /**
   * Gets routes filtered by HTTP method
   *
   * @param method - HTTP method to filter by
   * @returns Immutable array of matching routes
   */
  getByMethod(method: HttpMethod): ReadonlyArray<Route<any, any, any, any>> {
    // Guard clause
    if (!method) {
      throw new Error('Method is required');
    }

    // Functional programming: filter (doesn't mutate)
    return this.getAll().filter((route) => route.method === method);
  }

  /**
   * Gets routes filtered by tag
   *
   * @param tag - Tag to filter by
   * @returns Immutable array of routes containing the tag
   */
  getByTag(tag: string): ReadonlyArray<Route<any, any, any, any>> {
    // Guard clause
    if (!tag) {
      throw new Error('Tag is required');
    }

    // Functional programming: filter
    return this.getAll().filter((route) => route.config.tags?.includes(tag));
  }

  /**
   * Counts total registered routes
   *
   * @returns Number of routes
   */
  count(): number {
    return this.routes.size;
  }

  /**
   * Clears all routes from registry
   * Useful for testing
   */
  clear(): void {
    this.routes.clear();
  }

  /**
   * Deletes a specific route
   *
   * @param method - HTTP method
   * @param path - Route path
   * @returns true if deleted, false if didn't exist
   */
  delete(method: HttpMethod, path: string): boolean {
    // Guard clauses
    if (!method) {
      throw new Error('Method is required');
    }

    if (!path) {
      throw new Error('Path is required');
    }

    // Happy path
    const routeId = `${method}:${path}`;
    return this.routes.delete(routeId);
  }
}

/**
 * Exported singleton (Module Pattern)
 * Instance created only once
 */
export const RouteRegistry = new RouteRegistryImpl();

/**
 * Factory for testing - allows creating new instances
 * Not exported in production, only for tests
 */
export const createRouteRegistry = (): RouteRegistryImpl => new RouteRegistryImpl();
