/**
 * SchemaValidator tests
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createSchemaValidator } from '../../../src/application/SchemaValidator';
import { ValidationException } from '../../../src/domain/HTTPException';

describe('SchemaValidator', () => {
  const validator = createSchemaValidator();

  describe('validate', () => {
    it('should validate valid data successfully', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'Gaby', age: 30 };

      const result = validator.validate(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should return errors for invalid data', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const data = { email: 'invalid-email', age: 15 };

      const result = validator.validate(schema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(2);
        expect(result.errors[0].field).toBe('email');
        expect(result.errors[1].field).toBe('age');
      }
    });

    it('should handle nested object validation', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });

      const data = {
        user: {
          name: 'Gaby',
          email: 'invalid',
        },
      };

      const result = validator.validate(schema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].field).toBe('user.email');
      }
    });

    it('should throw error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => validator.validate(null as any, {})).toThrow('Schema is required');
    });

    it('should throw error if schema is undefined', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => validator.validate(undefined as any, {})).toThrow('Schema is required');
    });

    it('should handle missing required fields', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'Gaby' }; // age missing

      const result = validator.validate(schema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].field).toBe('age');
      }
    });

    it('should handle array validation', () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      const data = { tags: ['tag1', 'tag2'] };

      const result = validator.validate(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['tag1', 'tag2']);
      }
    });

    it('should handle optional fields', () => {
      const schema = z.object({
        name: z.string(),
        nickname: z.string().optional(),
      });

      const data = { name: 'Gaby' }; // nickname optional

      const result = validator.validate(schema, data);

      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const schema = z.object({
        name: z.string(),
        role: z.string().default('user'),
      });

      const data = { name: 'Gaby' };

      const result = validator.validate(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('user');
      }
    });

    it('should coerce types when specified', () => {
      const schema = z.object({
        id: z.coerce.number(),
      });

      const data = { id: '123' }; // String que se convierte a number

      const result = validator.validate(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
        expect(typeof result.data.id).toBe('number');
      }
    });
  });

  describe('validateOrThrow', () => {
    it('should return validated data if valid', () => {
      const schema = z.object({ name: z.string() });
      const data = { name: 'Gaby' };

      const validated = validator.validateOrThrow(schema, data);

      expect(validated).toEqual(data);
    });

    it('should throw ValidationException if invalid', () => {
      const schema = z.object({ email: z.string().email() });
      const data = { email: 'invalid' };

      expect(() => validator.validateOrThrow(schema, data)).toThrow(ValidationException);
    });

    it('should throw ValidationException with formatted errors', () => {
      const schema = z.object({ age: z.number().min(18) });
      const data = { age: 15 };

      try {
        validator.validateOrThrow(schema, data);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        if (error instanceof ValidationException) {
          expect(error.statusCode).toBe(422);
          expect(error.errors).toHaveLength(1);
          expect(error.errors[0].field).toBe('age');
        }
      }
    });

    it('should throw error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => validator.validateOrThrow(null as any, {})).toThrow('Schema is required');
    });
  });

  describe('validateMany', () => {
    it('should validate multiple schemas successfully', () => {
      const validations = [
        { schema: z.string(), data: 'hello' },
        { schema: z.number(), data: 42 },
        { schema: z.boolean(), data: true },
      ];

      const results = validator.validateMany(validations);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should return mix of successes and failures', () => {
      const validations = [
        { schema: z.string(), data: 'valid' },
        { schema: z.number(), data: 'invalid' }, // Should fail
        { schema: z.boolean(), data: true },
      ];

      const results = validator.validateMany(validations);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it('should throw error if validations array is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => validator.validateMany(null as any)).toThrow('Validations array is required');
    });

    it('should handle empty array', () => {
      const results = validator.validateMany([]);

      expect(results).toEqual([]);
    });
  });

  describe('isValid', () => {
    it('should return true for valid data', () => {
      const schema = z.string().email();
      const data = 'gaby@example.com';

      expect(validator.isValid(schema, data)).toBe(true);
    });

    it('should return false for invalid data', () => {
      const schema = z.string().email();
      const data = 'invalid-email';

      expect(validator.isValid(schema, data)).toBe(false);
    });

    it('should throw error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => validator.isValid(null as any, {})).toThrow('Schema is required');
    });
  });

  describe('validatePartial', () => {
    it('should validate only provided fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number(),
      });

      const data = { name: 'Gaby' }; // Solo name

      const result = validator.validatePartial(schema, data);

      expect(result.success).toBe(true);
    });

    it('should still validate types of provided fields', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { age: 'invalid' }; // Wrong type

      const result = validator.validatePartial(schema, data);

      expect(result.success).toBe(false);
    });

    it('should throw error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => validator.validatePartial(null as any, {})).toThrow('Schema is required');
    });
  });

  describe('getDefaults', () => {
    it('should extract default values from schema', () => {
      const schema = z.object({
        name: z.string().default('Anonymous'),
        role: z.string().default('user'),
      });

      const defaults = validator.getDefaults(schema);

      expect(defaults).toBeDefined();
      if (defaults) {
        expect(defaults.name).toBe('Anonymous');
        expect(defaults.role).toBe('user');
      }
    });

    it('should return undefined if schema has no defaults', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const defaults = validator.getDefaults(schema);

      expect(defaults).toBeUndefined();
    });

    it('should throw error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => validator.getDefaults(null as any)).toThrow('Schema is required');
    });
  });

  describe('validateAndTransform', () => {
    it('should validate and transform data', () => {
      const schema = z.object({
        firstName: z.string(),
        lastName: z.string(),
      });

      const data = { firstName: 'Gabriel', lastName: 'Gomez' };

      const result = validator.validateAndTransform(schema, data, (validated) => ({
        fullName: `${validated.firstName} ${validated.lastName}`,
      }));

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('Gabriel Gomez');
      }
    });

    it('should return validation errors if data is invalid', () => {
      const schema = z.object({ age: z.number() });
      const data = { age: 'invalid' };

      const result = validator.validateAndTransform(schema, data, (validated) => validated);

      expect(result.success).toBe(false);
    });

    it('should catch transform function errors', () => {
      const schema = z.object({ value: z.number() });
      const data = { value: 10 };

      const result = validator.validateAndTransform(schema, data, () => {
        throw new Error('Transform failed');
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].field).toBe('transform');
        expect(result.errors[0].message).toBe('Transform failed');
      }
    });

    it('should throw error if schema is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => validator.validateAndTransform(null as any, {}, (x) => x)).toThrow(
        'Schema is required',
      );
    });

    it('should throw error if transform function is null', () => {
      const schema = z.object({ name: z.string() });

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => validator.validateAndTransform(schema, {}, null as any)).toThrow(
        'Transform function is required',
      );
    });
  });

  describe('Boundary conditions', () => {
    it('should handle very large objects', () => {
      const largeObject: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`field${i}`] = `value${i}`;
      }

      const schema = z.record(z.string());
      const result = validator.validate(schema, largeObject);

      expect(result.success).toBe(true);
    });

    it('should handle deeply nested objects', () => {
      const schema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              value: z.string(),
            }),
          }),
        }),
      });

      const data = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      const result = validator.validate(schema, data);

      expect(result.success).toBe(true);
    });

    it('should handle union types', () => {
      const schema = z.union([z.string(), z.number()]);

      expect(validator.isValid(schema, 'hello')).toBe(true);
      expect(validator.isValid(schema, 42)).toBe(true);
      expect(validator.isValid(schema, true)).toBe(false);
    });
  });
});
