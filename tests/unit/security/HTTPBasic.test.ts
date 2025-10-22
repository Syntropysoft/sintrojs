/**
 * Unit tests for HTTPBasic
 */

import { describe, test, expect } from 'vitest';
import { HTTPBasic } from '../../../src/security/HTTPBasic';
import { HTTPException } from '../../../src/domain/HTTPException';
import type { FastifyRequest } from 'fastify';

describe('HTTPBasic', () => {
  const basic = new HTTPBasic();

  describe('validate', () => {
    test('should extract valid Basic auth credentials', async () => {
      // "user:pass" in base64
      const request = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz',
        },
      } as FastifyRequest;

      const credentials = await basic.validate(request);

      expect(credentials).toEqual({
        username: 'user',
        password: 'pass',
      });
    });

    test('should extract credentials with special characters', async () => {
      // "admin@example.com:P@ssw0rd!" in base64
      const base64 = Buffer.from('admin@example.com:P@ssw0rd!').toString('base64');
      const request = {
        headers: {
          authorization: `Basic ${base64}`,
        },
      } as FastifyRequest;

      const credentials = await basic.validate(request);

      expect(credentials).toEqual({
        username: 'admin@example.com',
        password: 'P@ssw0rd!',
      });
    });

    test('should extract credentials with empty password', async () => {
      // "user:" in base64 (empty password)
      const base64 = Buffer.from('user:').toString('base64');
      const request = {
        headers: {
          authorization: `Basic ${base64}`,
        },
      } as FastifyRequest;

      const credentials = await basic.validate(request);

      expect(credentials).toEqual({
        username: 'user',
        password: '',
      });
    });

    test('should extract credentials with colon in password', async () => {
      // "user:pass:word" in base64 (password contains colon)
      const base64 = Buffer.from('user:pass:word').toString('base64');
      const request = {
        headers: {
          authorization: `Basic ${base64}`,
        },
      } as FastifyRequest;

      const credentials = await basic.validate(request);

      expect(credentials).toEqual({
        username: 'user',
        password: 'pass:word',
      });
    });

    test('should handle credentials with spaces', async () => {
      const base64 = Buffer.from('user name:pass word').toString('base64');
      const request = {
        headers: {
          authorization: `Basic ${base64}`,
        },
      } as FastifyRequest;

      const credentials = await basic.validate(request);

      expect(credentials).toEqual({
        username: 'user name',
        password: 'pass word',
      });
    });

    // Guard clauses
    test('should throw 401 if Authorization header is missing', async () => {
      const request = {
        headers: {},
      } as FastifyRequest;

      await expect(basic.validate(request)).rejects.toThrow(HTTPException);
      await expect(basic.validate(request)).rejects.toThrow('Not authenticated');

      try {
        await basic.validate(request);
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException);
        expect((error as HTTPException).statusCode).toBe(401);
        expect((error as HTTPException).headers).toEqual({ 'WWW-Authenticate': 'Basic' });
      }
    });

    test('should throw 401 if Authorization header does not start with Basic', async () => {
      const request = {
        headers: {
          authorization: 'Bearer my-token',
        },
      } as FastifyRequest;

      await expect(basic.validate(request)).rejects.toThrow(HTTPException);
      await expect(basic.validate(request)).rejects.toThrow('Invalid authentication credentials');

      try {
        await basic.validate(request);
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPException);
        expect((error as HTTPException).statusCode).toBe(401);
        expect((error as HTTPException).headers).toEqual({ 'WWW-Authenticate': 'Basic' });
      }
    });

    test('should throw 401 if credentials are empty after Basic', async () => {
      const request = {
        headers: {
          authorization: 'Basic ',
        },
      } as FastifyRequest;

      await expect(basic.validate(request)).rejects.toThrow(HTTPException);
      await expect(basic.validate(request)).rejects.toThrow('Invalid authentication credentials');

      try {
        await basic.validate(request);
      } catch (error) {
        expect((error as HTTPException).statusCode).toBe(401);
        expect((error as HTTPException).headers).toEqual({ 'WWW-Authenticate': 'Basic' });
      }
    });

    test('should throw 401 if credentials are only whitespace', async () => {
      const request = {
        headers: {
          authorization: 'Basic    ',
        },
      } as FastifyRequest;

      await expect(basic.validate(request)).rejects.toThrow('Invalid authentication credentials');
    });

    test('should throw 401 if base64 is invalid', async () => {
      const request = {
        headers: {
          authorization: 'Basic !!invalid-base64!!',
        },
      } as FastifyRequest;

      await expect(basic.validate(request)).rejects.toThrow('Invalid authentication credentials');
    });

    test('should throw 401 if credentials do not contain colon', async () => {
      // "userpass" without colon
      const base64 = Buffer.from('userpass').toString('base64');
      const request = {
        headers: {
          authorization: `Basic ${base64}`,
        },
      } as FastifyRequest;

      await expect(basic.validate(request)).rejects.toThrow('Invalid authentication credentials');
    });

    test('should throw 401 if username is empty', async () => {
      // ":password" (empty username)
      const base64 = Buffer.from(':password').toString('base64');
      const request = {
        headers: {
          authorization: `Basic ${base64}`,
        },
      } as FastifyRequest;

      await expect(basic.validate(request)).rejects.toThrow('Invalid authentication credentials');
    });

    test('should throw 401 if Authorization is lowercase basic', async () => {
      const request = {
        headers: {
          authorization: 'basic dXNlcjpwYXNz',
        },
      } as FastifyRequest;

      await expect(basic.validate(request)).rejects.toThrow('Invalid authentication credentials');
    });
  });
});

