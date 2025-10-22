/**
 * DependencyInjector - Application Service
 *
 * Responsibility: Manage dependency injection with singleton and request scopes
 * Pattern: Singleton (Module Pattern)
 * Principles: SOLID, Guard Clauses, Functional Programming
 */

import type { RequestContext } from '../domain/types';

/**
 * Dependency factory function
 * Can be async or sync
 */
export type DependencyFactory<T> = (context: RequestContext) => T | Promise<T>;

/**
 * Dependency cleanup function
 * Called when request ends or dependency is disposed
 */
export type DependencyCleanup = () => void | Promise<void>;

/**
 * Dependency provider with scope and cleanup
 */
export interface DependencyProvider<T> {
  /** Factory function that creates the dependency */
  factory: DependencyFactory<T>;

  /** Scope: 'singleton' or 'request' */
  scope: 'singleton' | 'request';

  /** Optional cleanup function */
  cleanup?: DependencyCleanup;
}

/**
 * Dependency metadata for registration
 */
export interface DependencyMetadata<T> {
  provider: DependencyProvider<T>;
}

/**
 * Resolved dependencies record
 */
export type ResolvedDependencies = Record<string, unknown>;

/**
 * Dependency injector implementation
 */
class DependencyInjectorImpl {
  /** Singleton instances cache (shared across all requests) */
  private readonly singletonCache = new Map<string, unknown>();

  /**
   * Resolves dependencies for a request
   *
   * @param dependencies - Record of dependency names to providers
   * @param context - Request context
   * @returns Resolved dependencies and cleanup function
   */
  async resolve<T extends Record<string, DependencyMetadata<unknown>>>(
    dependencies: T,
    context: RequestContext,
  ): Promise<{
    resolved: ResolvedDependencies;
    cleanup: () => Promise<void>;
  }> {
    // Guard clause
    if (!dependencies) {
      throw new Error('Dependencies object is required');
    }

    if (!context) {
      throw new Error('Request context is required');
    }

    const resolved: ResolvedDependencies = {};
    const cleanupFns: DependencyCleanup[] = [];

    // Resolve each dependency
    for (const [name, metadata] of Object.entries(dependencies)) {
      const { provider } = metadata;

      // Guard clause
      if (!provider) {
        throw new Error(`Provider for dependency '${name}' is required`);
      }

      if (!provider.factory) {
        throw new Error(`Factory function for dependency '${name}' is required`);
      }

      // Resolve based on scope
      if (provider.scope === 'singleton') {
        // Singleton: use cached instance or create new one
        if (this.singletonCache.has(name)) {
          resolved[name] = this.singletonCache.get(name);
        } else {
          const instance = await provider.factory(context);
          this.singletonCache.set(name, instance);
          resolved[name] = instance;

          // Register cleanup for singleton (called on app shutdown)
          if (provider.cleanup) {
            cleanupFns.push(provider.cleanup);
          }
        }
      } else {
        // Request scope: create new instance for each request
        const instance = await provider.factory(context);
        resolved[name] = instance;

        // Register cleanup for request-scoped dependency
        if (provider.cleanup) {
          cleanupFns.push(provider.cleanup);
        }
      }
    }

    // Return resolved dependencies and cleanup function
    return {
      resolved,
      cleanup: async () => {
        // Execute all cleanup functions in reverse order (LIFO)
        for (const cleanupFn of cleanupFns.reverse()) {
          await cleanupFn();
        }
      },
    };
  }

  /**
   * Clears singleton cache (useful for testing)
   */
  clearSingletons(): void {
    this.singletonCache.clear();
  }

  /**
   * Gets number of cached singletons
   */
  getSingletonCount(): number {
    return this.singletonCache.size;
  }
}

/**
 * Exported singleton (Module Pattern)
 */
export const DependencyInjector = new DependencyInjectorImpl();

/**
 * Factory for testing
 */
export const createDependencyInjector = (): DependencyInjectorImpl => new DependencyInjectorImpl();

/**
 * Helper function to create a dependency provider
 *
 * @param factory - Factory function
 * @param options - Provider options
 * @returns Dependency metadata
 */
export function inject<T>(
  factory: DependencyFactory<T>,
  options?: {
    scope?: 'singleton' | 'request';
    cleanup?: DependencyCleanup;
  },
): DependencyMetadata<T> {
  // Guard clauses
  if (!factory) {
    throw new Error('Factory function is required');
  }

  return {
    provider: {
      factory,
      scope: options?.scope ?? 'request', // Default to request scope (safer)
      cleanup: options?.cleanup,
    },
  };
}

