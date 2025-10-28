/**
 * Unit tests for API Key authentication
 */

import type { FastifyRequest } from 'fastify';
import { describe, expect, test } from 'vitest';
import { HTTPException } from '../../../src/domain/HTTPException';
import { APIKeyCookie, APIKeyHeader, APIKeyQuery } from '../../../src/security/APIKey';

describe('APIKeyHeader', () => {
  // ============================================
  // Constructor
  // ============================================

  describe('constructor', () => {
    test('should create instance with default header name', () => {
      const apiKey = new APIKeyHeader();

      expect(apiKey.name).toBe('X-API-Key');
    });

    test('should create instance with custom header name', () => {
      const apiKey = new APIKeyHeader('X-Custom-Key');

      expect(apiKey.name).toBe('X-Custom-Key');
    });

    test('should throw if header name is empty', () => {
      expect(() => new APIKeyHeader('')).toThrow('Header name is required');
    });

    test('should throw if header name is whitespace', () => {
      expect(() => new APIKeyHeader('   ')).toThrow('Header name is required');
    });
  });

  // ============================================
  // validate()
  // ============================================

  describe('validate', () => {
    test('should extract API key from default header', async () => {
      const apiKey = new APIKeyHeader();
      const request = {
        headers: {
          'x-api-key': 'my-secret-key',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-secret-key');
    });

    test('should extract API key from custom header', async () => {
      const apiKey = new APIKeyHeader('X-Custom-Key');
      const request = {
        headers: {
          'x-custom-key': 'my-custom-key',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-custom-key');
    });

    test('should handle case-insensitive header names', async () => {
      const apiKey = new APIKeyHeader('X-API-Key');
      const request = {
        headers: {
          'x-api-key': 'my-key', // Fastify normalizes to lowercase
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-key');
    });

    test('should trim whitespace from API key', async () => {
      const apiKey = new APIKeyHeader();
      const request = {
        headers: {
          'x-api-key': '  my-key-with-spaces  ',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-key-with-spaces');
    });

    test('should extract complex API key', async () => {
      const apiKey = new APIKeyHeader();
      const complexKey = 'test_sk_live_51HfGYzIKFwR7Mm0vL8JzKxYq9qN7f8';
      const request = {
        headers: {
          'x-api-key': complexKey,
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe(complexKey);
    });

    // Guard clauses
    test('should throw 403 if header is missing', async () => {
      const apiKey = new APIKeyHeader();
      const request = {
        headers: {},
      } as any as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow(HTTPException);
      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');

      try {
        await apiKey.validate(request);
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException);
        expect((error as HTTPException).statusCode).toBe(403);
      }
    });

    test('should throw 403 if header is empty', async () => {
      const apiKey = new APIKeyHeader();
      const request = {
        headers: {
          'x-api-key': '',
        },
      } as any as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');
    });

    test('should throw 403 if header is whitespace', async () => {
      const apiKey = new APIKeyHeader();
      const request = {
        headers: {
          'x-api-key': '   ',
        },
      } as any as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');
    });
  });
});

describe('APIKeyCookie', () => {
  // ============================================
  // Constructor
  // ============================================

  describe('constructor', () => {
    test('should create instance with cookie name', () => {
      const apiKey = new APIKeyCookie('api_key');

      expect(apiKey.name).toBe('api_key');
    });

    test('should throw if cookie name is empty', () => {
      expect(() => new APIKeyCookie('')).toThrow('Cookie name is required');
    });

    test('should throw if cookie name is whitespace', () => {
      expect(() => new APIKeyCookie('   ')).toThrow('Cookie name is required');
    });
  });

  // ============================================
  // validate()
  // ============================================

  describe('validate', () => {
    test('should extract API key from cookie', async () => {
      const apiKey = new APIKeyCookie('api_key');
      const request = {
        cookies: {
          api_key: 'my-secret-key',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-secret-key');
    });

    test('should extract API key from custom cookie name', async () => {
      const apiKey = new APIKeyCookie('session_token');
      const request = {
        cookies: {
          session_token: 'my-session-token',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-session-token');
    });

    test('should trim whitespace from API key', async () => {
      const apiKey = new APIKeyCookie('api_key');
      const request = {
        cookies: {
          api_key: '  my-key  ',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-key');
    });

    // Guard clauses
    test('should throw 403 if cookie is missing', async () => {
      const apiKey = new APIKeyCookie('api_key');
      const request = {
        cookies: {},
      } as any as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow(HTTPException);
      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');

      try {
        await apiKey.validate(request);
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException);
        expect((error as HTTPException).statusCode).toBe(403);
      }
    });

    test('should throw 403 if cookies object is undefined', async () => {
      const apiKey = new APIKeyCookie('api_key');
      const request = {
        cookies: undefined,
      } as unknown as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');
    });

    test('should throw 403 if cookie is empty', async () => {
      const apiKey = new APIKeyCookie('api_key');
      const request = {
        cookies: {
          api_key: '',
        },
      } as any as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');
    });

    test('should throw 403 if cookie is whitespace', async () => {
      const apiKey = new APIKeyCookie('api_key');
      const request = {
        cookies: {
          api_key: '   ',
        },
      } as any as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');
    });
  });
});

describe('APIKeyQuery', () => {
  // ============================================
  // Constructor
  // ============================================

  describe('constructor', () => {
    test('should create instance with query parameter name', () => {
      const apiKey = new APIKeyQuery('api_key');

      expect(apiKey.name).toBe('api_key');
    });

    test('should throw if query parameter name is empty', () => {
      expect(() => new APIKeyQuery('')).toThrow('Query parameter name is required');
    });

    test('should throw if query parameter name is whitespace', () => {
      expect(() => new APIKeyQuery('   ')).toThrow('Query parameter name is required');
    });
  });

  // ============================================
  // validate()
  // ============================================

  describe('validate', () => {
    test('should extract API key from query parameter', async () => {
      const apiKey = new APIKeyQuery('api_key');
      const request = {
        query: {
          api_key: 'my-secret-key',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-secret-key');
    });

    test('should extract API key from custom query parameter', async () => {
      const apiKey = new APIKeyQuery('token');
      const request = {
        query: {
          token: 'my-token',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-token');
    });

    test('should trim whitespace from API key', async () => {
      const apiKey = new APIKeyQuery('api_key');
      const request = {
        query: {
          api_key: '  my-key  ',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-key');
    });

    test('should handle multiple query parameters', async () => {
      const apiKey = new APIKeyQuery('api_key');
      const request = {
        query: {
          api_key: 'my-key',
          other_param: 'value',
        },
      } as any as FastifyRequest;

      const key = await apiKey.validate(request);

      expect(key).toBe('my-key');
    });

    // Guard clauses
    test('should throw 403 if query parameter is missing', async () => {
      const apiKey = new APIKeyQuery('api_key');
      const request = {
        query: {},
      } as any as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow(HTTPException);
      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');

      try {
        await apiKey.validate(request);
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException);
        expect((error as HTTPException).statusCode).toBe(403);
      }
    });

    test('should throw 403 if query parameter is empty', async () => {
      const apiKey = new APIKeyQuery('api_key');
      const request = {
        query: {
          api_key: '',
        },
      } as any as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');
    });

    test('should throw 403 if query parameter is whitespace', async () => {
      const apiKey = new APIKeyQuery('api_key');
      const request = {
        query: {
          api_key: '   ',
        },
      } as any as FastifyRequest;

      await expect(apiKey.validate(request)).rejects.toThrow('Not authenticated');
    });
  });
});
