/**
 * ZodAdapter - Infrastructure Layer
 *
 * Responsibility: Adapt Zod schemas to OpenAPI JSON Schema
 * Pattern: Adapter Pattern
 * Principles: Single Responsibility, Guard Clauses
 */

import type { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * JSON Schema type (OpenAPI compatible)
 */
export type JsonSchema = Record<string, unknown>;

/**
 * Zod adapter implementation
 */
class ZodAdapterImpl {
  /**
   * Converts Zod schema to JSON Schema (OpenAPI compatible)
   *
   * Pure function: same input → same output
   *
   * @param schema - Zod schema
   * @param options - Conversion options
   * @returns JSON Schema object
   */
  toJsonSchema(
    schema: ZodSchema,
    options?: {
      name?: string;
      $refStrategy?: 'root' | 'relative' | 'none';
    },
  ): JsonSchema {
    // Guard clause
    if (!schema) {
      throw new Error('Schema is required');
    }

    // Convert using zod-to-json-schema
    const jsonSchema = zodToJsonSchema(schema, {
      name: options?.name,
      $refStrategy: options?.$refStrategy ?? 'none',
      target: 'openApi3',
    });

    return jsonSchema as JsonSchema;
  }

  /**
   * Checks if schema is optional
   *
   * @param schema - Zod schema
   * @returns true if optional, false otherwise
   */
  isOptional(schema: ZodSchema): boolean {
    // Guard clause
    if (!schema) {
      throw new Error('Schema is required');
    }

    return schema.isOptional();
  }

  /**
   * Checks if schema is nullable
   *
   * @param schema - Zod schema
   * @returns true if nullable, false otherwise
   */
  isNullable(schema: ZodSchema): boolean {
    // Guard clause
    if (!schema) {
      throw new Error('Schema is required');
    }

    return schema.isNullable();
  }

  /**
   * Extracts description from schema if exists
   *
   * @param schema - Zod schema
   * @returns Description string or undefined
   */
  getDescription(schema: ZodSchema): string | undefined {
    // Guard clause
    if (!schema) {
      throw new Error('Schema is required');
    }

    return schema.description;
  }
}

/**
 * Exported singleton (Module Pattern)
 */
export const ZodAdapter = new ZodAdapterImpl();

/**
 * Factory for testing
 */
export const createZodAdapter = (): ZodAdapterImpl => new ZodAdapterImpl();
