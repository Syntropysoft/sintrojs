/**
 * Enhanced Guard Clauses for SyntroJS
 *
 * Principles:
 * - Fail fast
 * - Clear error messages
 * - Consistent validation patterns
 * - Type safety
 */

import { z } from 'zod';
import type { HttpMethod, RouteConfig } from './types';

/**
 * GUARD CLAUSE UTILITIES
 * Standardized validation patterns
 */

export class Guard {
  /**
   * Required value validation
   */
  static required<T>(value: T | null | undefined, name: string): T {
    if (value === null || value === undefined) {
      throw new Error(`${name} is required`);
    }
    return value;
  }

  /**
   * Non-empty string validation
   */
  static notEmpty(value: string, name: string): string {
    if (!value || value.trim().length === 0) {
      throw new Error(`${name} cannot be empty`);
    }
    return value.trim();
  }

  /**
   * Non-empty array validation
   */
  static notEmptyArray<T>(value: T[], name: string): T[] {
    if (!value || value.length === 0) {
      throw new Error(`${name} cannot be empty`);
    }
    return value;
  }

  /**
   * Positive number validation
   */
  static positive(value: number, name: string): number {
    if (value <= 0) {
      throw new Error(`${name} must be positive`);
    }
    return value;
  }

  /**
   * Non-negative number validation
   */
  static nonNegative(value: number, name: string): number {
    if (value < 0) {
      throw new Error(`${name} must be non-negative`);
    }
    return value;
  }

  /**
   * Port validation (0-65535)
   */
  static validPort(port: number): number {
    if (port < 0 || port > 65535) {
      throw new Error('Port must be between 0 and 65535');
    }
    return port;
  }

  /**
   * HTTP method validation
   */
  static validHttpMethod(method: string): HttpMethod {
    const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

    if (!validMethods.includes(method as HttpMethod)) {
      throw new Error(`Invalid HTTP method: ${method}. Must be one of: ${validMethods.join(', ')}`);
    }

    return method as HttpMethod;
  }

  /**
   * Path validation
   */
  static validPath(path: string): string {
    if (!path) {
      throw new Error('Path is required');
    }

    if (!path.startsWith('/')) {
      throw new Error('Path must start with /');
    }

    if (path.length > 1 && path.endsWith('/')) {
      throw new Error('Path cannot end with / (except root path)');
    }

    return path;
  }

  /**
   * URL validation
   */
  static validUrl(url: string, name: string): string {
    try {
      new URL(url);
      return url;
    } catch {
      throw new Error(`${name} must be a valid URL`);
    }
  }

  /**
   * Email validation
   */
  static validEmail(email: string, name: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new Error(`${name} must be a valid email address`);
    }

    return email;
  }

  /**
   * Range validation
   */
  static inRange(value: number, min: number, max: number, name: string): number {
    if (value < min || value > max) {
      throw new Error(`${name} must be between ${min} and ${max}`);
    }
    return value;
  }

  /**
   * Array length validation
   */
  static arrayLength<T>(array: T[], min: number, max: number, name: string): T[] {
    if (array.length < min) {
      throw new Error(`${name} must have at least ${min} items`);
    }

    if (array.length > max) {
      throw new Error(`${name} must have at most ${max} items`);
    }

    return array;
  }

  /**
   * Object property validation
   */
  static hasProperty<T extends Record<string, unknown>>(
    obj: T,
    property: keyof T,
    name: string,
  ): T {
    if (!(property in obj)) {
      throw new Error(`${name} must have property: ${String(property)}`);
    }
    return obj;
  }

  /**
   * Type validation using Zod schema
   */
  static validSchema<T>(schema: z.ZodSchema<T>, data: unknown, name: string): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`${name} validation failed: ${message}`);
      }
      throw new Error(`${name} validation failed: ${error}`);
    }
  }

  /**
   * Function validation
   */
  static isFunction(value: unknown, name: string): (...args: unknown[]) => unknown {
    if (typeof value !== 'function') {
      throw new Error(`${name} must be a function`);
    }
    return value as (...args: unknown[]) => unknown;
  }

  /**
   * Object validation
   */
  static isObject(value: unknown, name: string): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`${name} must be an object`);
    }
    return value as Record<string, unknown>;
  }

  /**
   * String length validation
   */
  static stringLength(value: string, min: number, max: number, name: string): string {
    if (value.length < min) {
      throw new Error(`${name} must be at least ${min} characters long`);
    }

    if (value.length > max) {
      throw new Error(`${name} must be at most ${max} characters long`);
    }

    return value;
  }

  /**
   * Regex pattern validation
   */
  static matchesPattern(value: string, pattern: RegExp, name: string, description: string): string {
    if (!pattern.test(value)) {
      throw new Error(`${name} must match pattern: ${description}`);
    }
    return value;
  }

  /**
   * Enum validation
   */
  static inEnum<T extends string>(value: string, enumValues: T[], name: string): T {
    if (!enumValues.includes(value as T)) {
      throw new Error(`${name} must be one of: ${enumValues.join(', ')}`);
    }
    return value as T;
  }

  /**
   * Conditional validation
   */
  static when<T>(condition: boolean, validator: (value: T) => T, value: T, name: string): T {
    if (condition) {
      return validator(value);
    }
    return value;
  }

  /**
   * Multiple validation with early exit
   */
  static all<T>(value: T, validators: Array<(value: T) => T>, name: string): T {
    return validators.reduce((acc, validator) => {
      try {
        return validator(acc);
      } catch (error) {
        throw new Error(`${name} validation failed: ${error}`);
      }
    }, value);
  }
}

/**
 * ROUTE-SPECIFIC GUARD CLAUSES
 * Specialized validation for route configuration
 */

export class RouteGuard {
  /**
   * Validate route configuration
   */
  static validateRouteConfig<
    TParams = unknown,
    TQuery = unknown,
    TBody = unknown,
    TResponse = unknown,
  >(
    config: RouteConfig<TParams, TQuery, TBody, TResponse>,
  ): RouteConfig<TParams, TQuery, TBody, TResponse> {
    // Guard: Config is required
    Guard.required(config, 'Route config');

    // Guard: Handler is required
    Guard.isFunction(config.handler, 'Route handler');

    // Guard: Optional validation schemas
    if (config.params) {
      Guard.validSchema(config.params, {}, 'Params schema');
    }

    if (config.query) {
      Guard.validSchema(config.query, {}, 'Query schema');
    }

    if (config.body) {
      Guard.validSchema(config.body, {}, 'Body schema');
    }

    if (config.response) {
      Guard.validSchema(config.response, {}, 'Response schema');
    }

    // Guard: Status code validation
    if (config.status !== undefined) {
      Guard.inRange(config.status, 100, 599, 'Status code');
    }

    // Guard: Documentation validation
    if (config.summary) {
      Guard.stringLength(config.summary, 1, 200, 'Summary');
    }

    if (config.description) {
      Guard.stringLength(config.description, 1, 1000, 'Description');
    }

    if (config.tags) {
      Guard.notEmptyArray(config.tags, 'Tags');
      config.tags.forEach((tag, index) => {
        Guard.stringLength(tag, 1, 50, `Tag ${index}`);
      });
    }

    return config;
  }

  /**
   * Validate route method and path
   */
  static validateRouteDefinition(
    method: string,
    path: string,
  ): { method: HttpMethod; path: string } {
    return {
      method: Guard.validHttpMethod(method),
      path: Guard.validPath(path),
    };
  }
}

/**
 * SERVER-SPECIFIC GUARD CLAUSES
 * Specialized validation for server configuration
 */

export class ServerGuard {
  /**
   * Validate server configuration
   */
  static validateServerConfig(config: {
    port?: number;
    host?: string;
    title?: string;
    version?: string;
    description?: string;
  }): typeof config {
    // Guard: Port validation
    if (config.port !== undefined) {
      config.port = Guard.validPort(config.port);
    }

    // Guard: Host validation
    if (config.host) {
      Guard.notEmpty(config.host, 'Host');
    }

    // Guard: Title validation
    if (config.title) {
      Guard.stringLength(config.title, 1, 100, 'Title');
    }

    // Guard: Version validation
    if (config.version) {
      Guard.stringLength(config.version, 1, 20, 'Version');
    }

    // Guard: Description validation
    if (config.description) {
      Guard.stringLength(config.description, 1, 500, 'Description');
    }

    return config;
  }
}

/**
 * CONTEXT-SPECIFIC GUARD CLAUSES
 * Specialized validation for request context
 */

export class ContextGuard {
  /**
   * Validate request context
   */
  static validateContext(context: Record<string, unknown>): void {
    Guard.required(context, 'Context');

    // Guard: Required context properties
    Guard.hasProperty(context, 'method', 'Context');
    Guard.hasProperty(context, 'path', 'Context');
    Guard.hasProperty(context, 'headers', 'Context');

    // Guard: Method validation
    Guard.validHttpMethod(context.method as string);

    // Guard: Path validation
    Guard.validPath(context.path as string);

    // Guard: Headers validation
    Guard.isObject(context.headers, 'Headers');
  }
}
