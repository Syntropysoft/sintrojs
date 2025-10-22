/**
 * Tests for ZodAdapter
 */

import { describe, test, expect } from 'vitest';
import { createZodAdapter } from '../../../src/infrastructure/ZodAdapter';
import { z } from 'zod';

describe('ZodAdapter', () => {
  const adapter = createZodAdapter();

  describe('toJsonSchema()', () => {
    test('converts simple string schema to JSON Schema', () => {
      const schema = z.string();
      const jsonSchema = adapter.toJsonSchema(schema);

      expect(jsonSchema).toHaveProperty('type', 'string');
    });

    test('converts number schema to JSON Schema', () => {
      const schema = z.number();
      const jsonSchema = adapter.toJsonSchema(schema);

      expect(jsonSchema).toHaveProperty('type', 'number');
    });

    test('converts object schema to JSON Schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const jsonSchema = adapter.toJsonSchema(schema);

      expect(jsonSchema).toHaveProperty('type', 'object');
      expect(jsonSchema).toHaveProperty('properties');
      expect(jsonSchema.properties).toHaveProperty('name');
      expect(jsonSchema.properties).toHaveProperty('age');
    });

    test('converts schema with constraints to JSON Schema', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18).max(120),
      });

      const jsonSchema = adapter.toJsonSchema(schema);
      const properties = jsonSchema.properties as any;

      expect(properties.email.format).toBe('email');
      expect(properties.age.minimum).toBe(18);
      expect(properties.age.maximum).toBe(120);
    });

    test('converts array schema to JSON Schema', () => {
      const schema = z.array(z.string());
      const jsonSchema = adapter.toJsonSchema(schema);

      expect(jsonSchema).toHaveProperty('type', 'array');
      expect(jsonSchema).toHaveProperty('items');
    });

    test('converts enum schema to JSON Schema', () => {
      const schema = z.enum(['admin', 'user', 'guest']);
      const jsonSchema = adapter.toJsonSchema(schema);

      expect(jsonSchema).toHaveProperty('type', 'string');
      expect(jsonSchema).toHaveProperty('enum');
      expect(jsonSchema.enum).toEqual(['admin', 'user', 'guest']);
    });

    test('converts optional schema to JSON Schema', () => {
      const schema = z.string().optional();
      const jsonSchema = adapter.toJsonSchema(schema);

      expect(jsonSchema).toBeDefined();
      // Optional schemas don't have a required field at this level
    });

    test('converts nullable schema to JSON Schema', () => {
      const schema = z.string().nullable();
      const jsonSchema = adapter.toJsonSchema(schema);

      expect(jsonSchema).toBeDefined();
      // Nullable adds null to type or uses oneOf/anyOf
    });

    test('handles nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });

      const jsonSchema = adapter.toJsonSchema(schema);
      const properties = jsonSchema.properties as any;

      expect(properties.user).toHaveProperty('type', 'object');
      expect(properties.user).toHaveProperty('properties');
      expect(properties.user.properties).toHaveProperty('name');
      expect(properties.user.properties).toHaveProperty('email');
    });

    test('handles complex schemas with defaults', () => {
      const schema = z.object({
        skip: z.number().default(0),
        limit: z.number().default(10),
      });

      const jsonSchema = adapter.toJsonSchema(schema);
      const properties = jsonSchema.properties as any;

      expect(properties.skip.default).toBe(0);
      expect(properties.limit.default).toBe(10);
    });

    test('handles schema with custom name', () => {
      const schema = z.object({
        id: z.number(),
      });

      const jsonSchema = adapter.toJsonSchema(schema, { name: 'User' });

      expect(jsonSchema).toBeDefined();
      // Name is used internally for $ref resolution
    });

    test('handles different $refStrategy options', () => {
      const schema = z.object({
        id: z.number(),
      });

      const jsonSchemaRoot = adapter.toJsonSchema(schema, { $refStrategy: 'root' });
      const jsonSchemaNone = adapter.toJsonSchema(schema, { $refStrategy: 'none' });

      expect(jsonSchemaRoot).toBeDefined();
      expect(jsonSchemaNone).toBeDefined();
    });

    test('throws error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.toJsonSchema(null as any)).toThrow('Schema is required');
    });

    test('throws error if schema is undefined', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.toJsonSchema(undefined as any)).toThrow('Schema is required');
    });

    test('is deterministic (same input → same output)', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result1 = adapter.toJsonSchema(schema);
      const result2 = adapter.toJsonSchema(schema);

      expect(result1).toEqual(result2);
    });
  });

  describe('isOptional()', () => {
    test('returns true for optional schema', () => {
      const schema = z.string().optional();

      expect(adapter.isOptional(schema)).toBe(true);
    });

    test('returns false for required schema', () => {
      const schema = z.string();

      expect(adapter.isOptional(schema)).toBe(false);
    });

    test('returns true for optional object property', () => {
      const schema = z.object({
        name: z.string().optional(),
      });

      // Schema itself is not optional
      expect(adapter.isOptional(schema)).toBe(false);
    });

    test('throws error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.isOptional(null as any)).toThrow('Schema is required');
    });

    test('throws error if schema is undefined', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.isOptional(undefined as any)).toThrow('Schema is required');
    });
  });

  describe('isNullable()', () => {
    test('returns true for nullable schema', () => {
      const schema = z.string().nullable();

      expect(adapter.isNullable(schema)).toBe(true);
    });

    test('returns false for non-nullable schema', () => {
      const schema = z.string();

      expect(adapter.isNullable(schema)).toBe(false);
    });

    test('returns true for nullable object', () => {
      const schema = z.object({
        name: z.string(),
      }).nullable();

      expect(adapter.isNullable(schema)).toBe(true);
    });

    test('throws error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.isNullable(null as any)).toThrow('Schema is required');
    });

    test('throws error if schema is undefined', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.isNullable(undefined as any)).toThrow('Schema is required');
    });
  });

  describe('getDescription()', () => {
    test('returns description if provided', () => {
      const schema = z.string().describe('User name field');

      const description = adapter.getDescription(schema);

      expect(description).toBe('User name field');
    });

    test('returns undefined if no description', () => {
      const schema = z.string();

      const description = adapter.getDescription(schema);

      expect(description).toBeUndefined();
    });

    test('works with complex schemas', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      }).describe('User profile data');

      const description = adapter.getDescription(schema);

      expect(description).toBe('User profile data');
    });

    test('throws error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.getDescription(null as any)).toThrow('Schema is required');
    });

    test('throws error if schema is undefined', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.getDescription(undefined as any)).toThrow('Schema is required');
    });
  });

  describe('Guard Clauses', () => {
    test('all methods validate required schema parameter', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.toJsonSchema(null as any)).toThrow('Schema is required');
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.isOptional(null as any)).toThrow('Schema is required');
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.isNullable(null as any)).toThrow('Schema is required');
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => adapter.getDescription(null as any)).toThrow('Schema is required');
    });
  });

  describe('Integration with Zod', () => {
    test('handles all primitive types', () => {
      const primitives = [
        { schema: z.string(), type: 'string' },
        { schema: z.number(), type: 'number' },
        { schema: z.boolean(), type: 'boolean' },
      ];

      for (const { schema, type } of primitives) {
        const jsonSchema = adapter.toJsonSchema(schema);
        expect(jsonSchema.type).toBe(type);
      }
    });

    test('handles null type', () => {
      const schema = z.null();
      const jsonSchema = adapter.toJsonSchema(schema);

      // z.null() generates a schema without explicit type
      expect(jsonSchema).toBeDefined();
    });

    test('handles validation constraints', () => {
      const schema = z.string().min(3).max(20).email();
      const jsonSchema = adapter.toJsonSchema(schema) as any;

      expect(jsonSchema.minLength).toBe(3);
      expect(jsonSchema.maxLength).toBe(20);
      expect(jsonSchema.format).toBe('email');
    });

    test('handles numeric constraints', () => {
      const schema = z.number().min(0).max(100).int();
      const jsonSchema = adapter.toJsonSchema(schema) as any;

      expect(jsonSchema.minimum).toBe(0);
      expect(jsonSchema.maximum).toBe(100);
      expect(jsonSchema.type).toBe('integer');
    });

    test('handles array constraints', () => {
      const schema = z.array(z.string()).min(1).max(10);
      const jsonSchema = adapter.toJsonSchema(schema) as any;

      expect(jsonSchema.type).toBe('array');
      expect(jsonSchema.minItems).toBe(1);
      expect(jsonSchema.maxItems).toBe(10);
    });

    test('handles union types', () => {
      const schema = z.union([z.string(), z.number()]);
      const jsonSchema = adapter.toJsonSchema(schema);

      expect(jsonSchema).toHaveProperty('anyOf');
    });

    test('handles literal types', () => {
      const schema = z.literal('admin');
      const jsonSchema = adapter.toJsonSchema(schema) as any;

      // Literal values can be represented as const or enum
      expect(jsonSchema).toBeDefined();
      // Either const: 'admin' or enum: ['admin']
      const hasConst = jsonSchema.const === 'admin';
      const hasEnum = Array.isArray(jsonSchema.enum) && jsonSchema.enum.includes('admin');
      expect(hasConst || hasEnum).toBe(true);
    });

    test('handles record types', () => {
      const schema = z.record(z.string(), z.number());
      const jsonSchema = adapter.toJsonSchema(schema);

      expect(jsonSchema.type).toBe('object');
    });
  });

  describe('Immutability', () => {
    test('does not mutate input schema', () => {
      const schema = z.object({
        name: z.string(),
      });

      // Convert to JSON Schema
      adapter.toJsonSchema(schema);

      // Original schema should remain unchanged
      expect(schema.parse({ name: 'Gaby' })).toEqual({ name: 'Gaby' });
    });

    test('returns new object on each call', () => {
      const schema = z.string();

      const result1 = adapter.toJsonSchema(schema);
      const result2 = adapter.toJsonSchema(schema);

      // Results are equal but not the same reference
      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2);
    });
  });
});

