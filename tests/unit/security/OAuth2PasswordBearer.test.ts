/**
 * Unit tests for OAuth2PasswordBearer
 */

import { describe, test, expect } from 'vitest';
import { OAuth2PasswordBearer } from '../../../src/security/OAuth2PasswordBearer';
import { HTTPException } from '../../../src/domain/HTTPException';
import type { FastifyRequest } from 'fastify';

describe('OAuth2PasswordBearer', () => {
  // ============================================
  // Constructor
  // ============================================

  describe('constructor', () => {
    test('should create instance with tokenUrl', () => {
      const oauth2 = new OAuth2PasswordBearer('/token');

      expect(oauth2.tokenUrl).toBe('/token');
      expect(oauth2.scopes).toBeUndefined();
    });

    test('should create instance with tokenUrl and scopes', () => {
      const scopes = {
        'read:user': 'Read user data',
        'write:user': 'Write user data',
      };
      const oauth2 = new OAuth2PasswordBearer('/token', scopes);

      expect(oauth2.tokenUrl).toBe('/token');
      expect(oauth2.scopes).toEqual(scopes);
    });

    test('should throw if tokenUrl is empty', () => {
      expect(() => new OAuth2PasswordBearer('')).toThrow('tokenUrl is required');
    });

    test('should throw if tokenUrl is whitespace', () => {
      expect(() => new OAuth2PasswordBearer('   ')).toThrow('tokenUrl is required');
    });
  });

  // ============================================
  // validate()
  // ============================================

  describe('validate', () => {
    const oauth2 = new OAuth2PasswordBearer('/token');

    test('should extract valid Bearer token', async () => {
      const request = {
        headers: {
          authorization: 'Bearer my-secret-token',
        },
      } as FastifyRequest;

      const token = await oauth2.validate(request);

      expect(token).toBe('my-secret-token');
    });

    test('should extract token with extra spaces', async () => {
      const request = {
        headers: {
          authorization: 'Bearer   my-token-with-spaces   ',
        },
      } as FastifyRequest;

      const token = await oauth2.validate(request);

      expect(token).toBe('my-token-with-spaces');
    });

    test('should extract complex token (JWT-like)', async () => {
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const request = {
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      } as FastifyRequest;

      const token = await oauth2.validate(request);

      expect(token).toBe(jwtToken);
    });

    // Guard clauses
    test('should throw 401 if Authorization header is missing', async () => {
      const request = {
        headers: {},
      } as FastifyRequest;

      await expect(oauth2.validate(request)).rejects.toThrow(HTTPException);
      await expect(oauth2.validate(request)).rejects.toThrow('Not authenticated');

      try {
        await oauth2.validate(request);
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException);
        expect((error as HTTPException).statusCode).toBe(401);
        expect((error as HTTPException).headers).toEqual({ 'WWW-Authenticate': 'Bearer' });
      }
    });

    test('should throw 401 if Authorization header does not start with Bearer', async () => {
      const request = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz',
        },
      } as FastifyRequest;

      await expect(oauth2.validate(request)).rejects.toThrow(HTTPException);
      await expect(oauth2.validate(request)).rejects.toThrow('Invalid authentication credentials');

      try {
        await oauth2.validate(request);
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException);
        expect((error as HTTPException).statusCode).toBe(401);
        expect((error as HTTPException).headers).toEqual({ 'WWW-Authenticate': 'Bearer' });
      }
    });

    test('should throw 401 if token is empty after Bearer', async () => {
      const request = {
        headers: {
          authorization: 'Bearer ',
        },
      } as FastifyRequest;

      await expect(oauth2.validate(request)).rejects.toThrow(HTTPException);
      await expect(oauth2.validate(request)).rejects.toThrow('Invalid authentication credentials');

      try {
        await oauth2.validate(request);
      } catch (error) {
        expect((error as HTTPException).statusCode).toBe(401);
        expect((error as HTTPException).headers).toEqual({ 'WWW-Authenticate': 'Bearer' });
      }
    });

    test('should throw 401 if token is only whitespace', async () => {
      const request = {
        headers: {
          authorization: 'Bearer    ',
        },
      } as FastifyRequest;

      await expect(oauth2.validate(request)).rejects.toThrow('Invalid authentication credentials');
    });

    test('should throw 401 if Authorization is lowercase bearer', async () => {
      const request = {
        headers: {
          authorization: 'bearer my-token',
        },
      } as FastifyRequest;

      await expect(oauth2.validate(request)).rejects.toThrow('Invalid authentication credentials');
    });
  });
});

