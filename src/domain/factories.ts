/**
 * Factory Pattern Types for SyntroJS
 *
 * Principios aplicados:
 * - SOLID: Single Responsibility, Dependency Inversion
 * - DDD: Domain entities with clear boundaries
 * - Functional Programming: Pure functions, immutability
 * - Guard Clauses: Input validation
 */

import type { MiddlewareConfig, RequestContext, RouteConfig } from './types';

// ===== GUARD CLAUSES =====

/**
 * Guard clause para validar configuración de factory
 */
export const guardFactoryConfig = <T>(config: T | null | undefined): T => {
  if (!config) {
    throw new Error('Factory configuration is required');
  }
  return config;
};

/**
 * Guard clause para validar contexto de request
 */
export const guardRequestContext = (context: RequestContext | null | undefined): RequestContext => {
  if (!context) {
    throw new Error('Request context is required');
  }
  return context;
};

// ===== FACTORY INTERFACES =====

/**
 * Base interface para todos los factories
 * Principio: Interface Segregation (SOLID)
 */
export interface BaseFactory<TInput, TOutput> {
  readonly inputType: string;
  readonly outputType: string;
  process(input: TInput): Promise<TOutput>;
}

/**
 * Factory para manejo de dependencias
 * Principio: Single Responsibility (SOLID)
 */
export interface DependencyResolverFactory extends BaseFactory<RequestContext, DependencyResult> {
  readonly dependencies: Record<string, unknown>;
  resolve(context: RequestContext): Promise<DependencyResult>;
  cleanup(): Promise<void>;
}

/**
 * Resultado de resolución de dependencias
 */
export interface DependencyResult {
  readonly resolved: Record<string, unknown>;
  readonly cleanup: () => Promise<void>;
}

/**
 * Factory para manejo de errores
 * Principio: Single Responsibility (SOLID)
 */
export interface ErrorHandlerFactory extends BaseFactory<ErrorContext, ErrorResponse> {
  readonly errorTypes: string[];
  handle(context: RequestContext, error: Error): Promise<ErrorResponse>;
}

/**
 * Contexto para manejo de errores
 */
export interface ErrorContext {
  readonly context: RequestContext;
  readonly error: Error;
  readonly route?: RouteConfig;
}

/**
 * Respuesta de error estandarizada
 */
export interface ErrorResponse {
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly body: {
    readonly error: string;
    readonly message: string;
    readonly path: string;
    readonly timestamp: string;
  };
}

/**
 * Factory para validación de schemas
 * Principio: Single Responsibility (SOLID)
 */
export interface SchemaFactory<T = unknown> extends BaseFactory<unknown, T> {
  readonly schema: unknown;
  readonly compiled: boolean;
  validate(data: unknown): Promise<T>;
  quickValidate(data: unknown): T;
}

/**
 * Factory para middleware
 * Principio: Single Responsibility (SOLID)
 */
export interface MiddlewareFactory extends BaseFactory<RequestContext, void> {
  readonly middleware: (context: RequestContext) => Promise<void> | void;
  readonly config: MiddlewareConfig;
  execute(context: RequestContext): Promise<void>;
}

// ===== FACTORY CREATORS =====

/**
 * Creador de DependencyResolverFactory
 * Principio: Factory Method (Creational Pattern)
 */
export const createDependencyResolverFactory = (
  dependencies: Record<string, unknown>,
): DependencyResolverFactory => {
  // Guard Clause
  guardFactoryConfig(dependencies);

  return {
    inputType: 'RequestContext',
    outputType: 'DependencyResult',
    dependencies: Object.freeze({ ...dependencies }),

    async resolve(context: RequestContext): Promise<DependencyResult> {
      guardRequestContext(context);

      // Implementación específica del factory
      const resolved: Record<string, unknown> = {};
      const cleanupFunctions: Array<() => Promise<void>> = [];

      for (const [key, dependency] of Object.entries(this.dependencies)) {
        if (typeof dependency === 'function') {
          const result = await (dependency as Function)(context);
          resolved[key] = result;

          // Si el resultado tiene cleanup, lo agregamos
          if (result && typeof result.cleanup === 'function') {
            cleanupFunctions.push(result.cleanup);
          }
        } else {
          resolved[key] = dependency;
        }
      }

      return {
        resolved: Object.freeze(resolved),
        cleanup: async () => {
          await Promise.all(cleanupFunctions.map((fn) => fn()));
        },
      };
    },

    async cleanup(): Promise<void> {
      // Cleanup específico del factory
    },

    async process(input: RequestContext): Promise<DependencyResult> {
      return this.resolve(input);
    },
  };
};

/**
 * Creador de ErrorHandlerFactory
 * Principio: Factory Method (Creational Pattern)
 */
export const createErrorHandlerFactory = (
  errorHandler: (context: RequestContext, error: Error) => Promise<ErrorResponse>,
): ErrorHandlerFactory => {
  // Guard Clause
  guardFactoryConfig(errorHandler);

  return {
    inputType: 'ErrorContext',
    outputType: 'ErrorResponse',
    errorTypes: ['Error', 'HTTPException', 'ValidationException'],

    async handle(context: RequestContext, error: Error): Promise<ErrorResponse> {
      guardRequestContext(context);

      if (!error) {
        throw new Error('Error is required');
      }

      return await errorHandler(context, error);
    },

    async process(input: ErrorContext): Promise<ErrorResponse> {
      return this.handle(input.context, input.error);
    },
  };
};

/**
 * Creador de SchemaFactory
 * Principio: Factory Method (Creational Pattern)
 */
export const createSchemaFactory = <T>(schema: unknown): SchemaFactory<T> => {
  // Guard Clause
  guardFactoryConfig(schema);

  return {
    inputType: 'unknown',
    outputType: 'T',
    schema: Object.freeze(schema),
    compiled: true,

    async validate(data: unknown): Promise<T> {
      // Implementación específica del factory
      if (this.schema && typeof (this.schema as any).parse === 'function') {
        return (this.schema as any).parse(data);
      }
      return data as T;
    },

    quickValidate(data: unknown): T {
      // Validación rápida sin async
      try {
        if (this.schema && typeof (this.schema as any).parse === 'function') {
          return (this.schema as any).parse(data);
        }
        return data as T;
      } catch {
        return data as T; // Fallback rápido
      }
    },

    async process(input: unknown): Promise<T> {
      return this.validate(input);
    },
  };
};

/**
 * Creador de MiddlewareFactory
 * Principio: Factory Method (Creational Pattern)
 */
export const createMiddlewareFactory = (
  middleware: (context: RequestContext) => Promise<void> | void,
  config: MiddlewareConfig,
): MiddlewareFactory => {
  // Guard Clauses
  guardFactoryConfig(middleware);
  guardFactoryConfig(config);

  return {
    inputType: 'RequestContext',
    outputType: 'void',
    middleware: Object.freeze(middleware),
    config: Object.freeze({ ...config }),

    async execute(context: RequestContext): Promise<void> {
      guardRequestContext(context);
      await this.middleware(context);
    },

    async process(input: RequestContext): Promise<void> {
      return this.execute(input);
    },
  };
};

// ===== UTILITY FUNCTIONS =====

/**
 * Función pura para crear múltiples factories
 * Principio: Functional Programming
 */
export const createFactories = <T extends Record<string, unknown>>(
  factoryCreators: T,
): Readonly<T> => {
  return Object.freeze(factoryCreators);
};

/**
 * Función pura para validar factory
 * Principio: Functional Programming
 */
export const validateFactory = <T extends BaseFactory<unknown, unknown>>(factory: T): boolean => {
  return (
    factory &&
    typeof factory.process === 'function' &&
    typeof factory.inputType === 'string' &&
    typeof factory.outputType === 'string'
  );
};
