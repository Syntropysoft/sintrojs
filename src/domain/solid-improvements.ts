/**
 * SOLID Principles Analysis and Improvements for SyntroJS
 *
 * Current Status:
 * ✅ Single Responsibility Principle (SRP) - Well implemented
 * ✅ Open/Closed Principle (OCP) - Good with adapters
 * ⚠️ Liskov Substitution Principle (LSP) - Needs improvement
 * ⚠️ Interface Segregation Principle (ISP) - Needs improvement
 * ⚠️ Dependency Inversion Principle (DIP) - Needs improvement
 */

import type { z } from 'zod';
import { Route } from './Route';
import type {
  RouteConfig as BaseRouteConfig,
  ExceptionHandler,
  HttpMethod,
  RequestContext,
} from './types';

/**
 * 1. INTERFACE SEGREGATION PRINCIPLE (ISP)
 *
 * Problem: Large interfaces force clients to depend on methods they don't use
 * Solution: Create smaller, focused interfaces
 */

// Current: Large RouteConfig interface
// Improvement: Split into focused interfaces

export interface RouteHandler<TResponse = unknown> {
  handler: (context: RequestContext) => TResponse | Promise<TResponse>;
}

export interface RouteValidation<TParams = unknown, TQuery = unknown, TBody = unknown> {
  params?: z.ZodSchema<TParams>;
  query?: z.ZodSchema<TQuery>;
  body?: z.ZodSchema<TBody>;
}

export interface RouteResponse<TResponse = unknown> {
  response?: z.ZodSchema<TResponse>;
  statusCode?: number;
}

export interface RouteErrorHandling {
  errorHandler?: ExceptionHandler;
}

export interface RouteDocumentation {
  summary?: string;
  description?: string;
  tags?: string[];
}

// Combined interface for backward compatibility
export interface RouteConfig<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
> extends RouteHandler<TResponse>,
    RouteValidation<TParams, TQuery, TBody>,
    RouteResponse<TResponse>,
    RouteErrorHandling,
    RouteDocumentation {}

/**
 * 2. DEPENDENCY INVERSION PRINCIPLE (DIP)
 *
 * Problem: High-level modules depend on low-level modules
 * Solution: Depend on abstractions, not concretions
 */

// Abstract interfaces for adapters
export interface HttpAdapter {
  create(config?: Record<string, unknown>): unknown;
  registerRoute(server: unknown, route: Route): Promise<void>;
  listen(server: unknown, port: number, host?: string): Promise<string>;
  close(server: unknown): Promise<void>;
}

export interface ValidationAdapter {
  validate<T>(schema: z.ZodSchema<T>, data: unknown): T;
  validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T;
}

export interface SerializationAdapter {
  serialize(data: unknown): string;
  deserialize<T>(data: string): T;
}

/**
 * 3. LISKOV SUBSTITUTION PRINCIPLE (LSP)
 *
 * Problem: Subtypes must be substitutable for their base types
 * Solution: Ensure behavioral compatibility
 */

// Base adapter that all adapters must implement
export abstract class BaseAdapter implements HttpAdapter {
  abstract create(config?: Record<string, unknown>): unknown;
  abstract listen(server: unknown, port: number, host?: string): Promise<string>;
  abstract close(server: unknown): Promise<void>;

  // Common behavior that all adapters share
  protected validateRoute(route: Route): void {
    if (!route) {
      throw new Error('Route is required');
    }
    if (!route.method) {
      throw new Error('Route method is required');
    }
    if (!route.path) {
      throw new Error('Route path is required');
    }
  }

  // Template method pattern for consistent behavior
  async registerRoute(server: unknown, route: Route): Promise<void> {
    this.validateRoute(route);
    await this.doRegisterRoute(server, route);
  }

  protected abstract doRegisterRoute(server: unknown, route: Route): Promise<void>;
}

/**
 * 4. FUNCTIONAL PROGRAMMING IMPROVEMENTS
 *
 * Problem: Imperative code mixed with functional
 * Solution: Pure functions, immutability, composition
 */

// Pure functions for route processing
export const createRoute = (method: HttpMethod, path: string, config: RouteConfig): Route => {
  // Guard clauses
  if (!method) throw new Error('Method is required');
  if (!path) throw new Error('Path is required');
  if (!config) throw new Error('Config is required');
  if (!config.handler) throw new Error('Handler is required');

  return new Route(method, path, config);
};

// Function composition for route validation
export const validateRouteConfig = (config: RouteConfig): RouteConfig => {
  const validators = [validateHandler, validateSchemas, validateDocumentation];

  return validators.reduce((acc, validator) => validator(acc), config);
};

// Pure validation functions
const validateHandler = (config: RouteConfig): RouteConfig => {
  if (!config.handler) {
    throw new Error('Handler is required');
  }
  return config;
};

const validateSchemas = (config: RouteConfig): RouteConfig => {
  // Schema validation logic
  return config;
};

const validateDocumentation = (config: RouteConfig): RouteConfig => {
  // Documentation validation logic
  return config;
};

/**
 * 5. GUARD CLAUSES IMPROVEMENTS
 *
 * Problem: Inconsistent guard clause usage
 * Solution: Standardize guard clause patterns
 */

// Standardized guard clause utilities
export const Guard = {
  required: <T>(value: T | null | undefined, name: string): T => {
    if (value === null || value === undefined) {
      throw new Error(`${name} is required`);
    }
    return value;
  },

  notEmpty: <T extends { length: number }>(value: T, name: string): T => {
    if (value.length === 0) {
      throw new Error(`${name} cannot be empty`);
    }
    return value;
  },

  positive: (value: number, name: string): number => {
    if (value <= 0) {
      throw new Error(`${name} must be positive`);
    }
    return value;
  },

  validPort: (port: number): number => {
    if (port < 0 || port > 65535) {
      throw new Error('Port must be between 0 and 65535');
    }
    return port;
  },
};

/**
 * 6. DOMAIN-DRIVEN DESIGN IMPROVEMENTS
 *
 * Problem: Domain logic mixed with infrastructure
 * Solution: Clear domain boundaries and value objects
 */

// Value Objects for better domain modeling
export class Port {
  private readonly value: number;

  constructor(value: number) {
    this.value = Guard.validPort(value);
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Port): boolean {
    return this.value === other.value;
  }
}

export class Host {
  private readonly value: string;

  constructor(value: string) {
    this.value = Guard.required(value, 'Host');
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Host): boolean {
    return this.value === other.value;
  }
}

export class ServerAddress {
  constructor(
    private readonly host: Host,
    private readonly port: Port,
  ) {}

  toString(): string {
    return `http://[${this.host.getValue()}]:${this.port.getValue()}`;
  }

  equals(other: ServerAddress): boolean {
    return this.host.equals(other.host) && this.port.equals(other.port);
  }
}
