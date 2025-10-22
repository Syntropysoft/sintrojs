/**
 * HTTPException tests
 * Testing all HTTP exception classes
 */

import { describe, expect, it } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HTTPException,
  InternalServerException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  ValidationException,
} from '../../../src/domain/HTTPException';

describe('HTTPException', () => {
  describe('Base HTTPException', () => {
    it('should create exception with status code and detail', () => {
      const error = new HTTPException(404, 'Resource not found');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HTTPException);
      expect(error.statusCode).toBe(404);
      expect(error.detail).toBe('Resource not found');
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('HTTPException');
    });

    it('should create exception with optional headers', () => {
      const headers = { 'X-Custom': 'value' };
      const error = new HTTPException(401, 'Unauthorized', headers);

      expect(error.statusCode).toBe(401);
      expect(error.headers).toEqual(headers);
    });

    it('should create exception without headers', () => {
      const error = new HTTPException(500, 'Internal error');

      expect(error.headers).toBeUndefined();
    });

    it('should maintain stack trace', () => {
      const error = new HTTPException(500, 'Error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('HTTPException.test.ts');
    });
  });

  describe('BadRequestException', () => {
    it('should create 400 exception with default message', () => {
      const error = new BadRequestException();

      expect(error.statusCode).toBe(400);
      expect(error.detail).toBe('Bad Request');
      expect(error.name).toBe('BadRequestException');
    });

    it('should create 400 exception with custom message', () => {
      const error = new BadRequestException('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.detail).toBe('Invalid input');
    });

    it('should create 400 exception with headers', () => {
      const headers = { 'X-Error': 'invalid-field' };
      const error = new BadRequestException('Invalid input', headers);

      expect(error.headers).toEqual(headers);
    });
  });

  describe('UnauthorizedException', () => {
    it('should create 401 exception with default message', () => {
      const error = new UnauthorizedException();

      expect(error.statusCode).toBe(401);
      expect(error.detail).toBe('Unauthorized');
      expect(error.name).toBe('UnauthorizedException');
    });

    it('should create 401 exception with custom message', () => {
      const error = new UnauthorizedException('Token expired');

      expect(error.statusCode).toBe(401);
      expect(error.detail).toBe('Token expired');
    });

    it('should create 401 exception with WWW-Authenticate header', () => {
      const headers = { 'WWW-Authenticate': 'Bearer' };
      const error = new UnauthorizedException('Invalid token', headers);

      expect(error.headers).toEqual(headers);
    });
  });

  describe('ForbiddenException', () => {
    it('should create 403 exception', () => {
      const error = new ForbiddenException();

      expect(error.statusCode).toBe(403);
      expect(error.detail).toBe('Forbidden');
      expect(error.name).toBe('ForbiddenException');
    });

    it('should create 403 exception with custom message', () => {
      const error = new ForbiddenException('Insufficient permissions');

      expect(error.detail).toBe('Insufficient permissions');
    });
  });

  describe('NotFoundException', () => {
    it('should create 404 exception', () => {
      const error = new NotFoundException();

      expect(error.statusCode).toBe(404);
      expect(error.detail).toBe('Not Found');
      expect(error.name).toBe('NotFoundException');
    });

    it('should create 404 exception with custom message', () => {
      const error = new NotFoundException('User not found');

      expect(error.detail).toBe('User not found');
    });
  });

  describe('ConflictException', () => {
    it('should create 409 exception', () => {
      const error = new ConflictException();

      expect(error.statusCode).toBe(409);
      expect(error.detail).toBe('Conflict');
      expect(error.name).toBe('ConflictException');
    });

    it('should create 409 exception with custom message', () => {
      const error = new ConflictException('Email already exists');

      expect(error.detail).toBe('Email already exists');
    });
  });

  describe('ValidationException', () => {
    it('should create 422 exception with validation errors', () => {
      const errors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'age', message: 'Must be at least 18' },
      ];
      const error = new ValidationException(errors);

      expect(error.statusCode).toBe(422);
      expect(error.detail).toBe('Validation Error');
      expect(error.name).toBe('ValidationException');
      expect(error.errors).toEqual(errors);
    });

    it('should create 422 exception with custom detail message', () => {
      const errors = [{ field: 'name', message: 'Required' }];
      const error = new ValidationException(errors, 'Invalid request data');

      expect(error.detail).toBe('Invalid request data');
      expect(error.errors).toEqual(errors);
    });

    it('should handle empty errors array', () => {
      const error = new ValidationException([]);

      expect(error.errors).toEqual([]);
    });
  });

  describe('InternalServerException', () => {
    it('should create 500 exception', () => {
      const error = new InternalServerException();

      expect(error.statusCode).toBe(500);
      expect(error.detail).toBe('Internal Server Error');
      expect(error.name).toBe('InternalServerException');
    });

    it('should create 500 exception with custom message', () => {
      const error = new InternalServerException('Database connection failed');

      expect(error.detail).toBe('Database connection failed');
    });
  });

  describe('ServiceUnavailableException', () => {
    it('should create 503 exception', () => {
      const error = new ServiceUnavailableException();

      expect(error.statusCode).toBe(503);
      expect(error.detail).toBe('Service Unavailable');
      expect(error.name).toBe('ServiceUnavailableException');
    });

    it('should create 503 exception with custom message', () => {
      const error = new ServiceUnavailableException('Service is down for maintenance');

      expect(error.detail).toBe('Service is down for maintenance');
    });

    it('should create 503 exception with Retry-After header', () => {
      const headers = { 'Retry-After': '120' };
      const error = new ServiceUnavailableException('Temporarily unavailable', headers);

      expect(error.headers).toEqual(headers);
    });
  });

  describe('Inheritance chain', () => {
    it('should maintain proper inheritance for all exceptions', () => {
      const exceptions = [
        new BadRequestException(),
        new UnauthorizedException(),
        new ForbiddenException(),
        new NotFoundException(),
        new ConflictException(),
        new ValidationException([]),
        new InternalServerException(),
        new ServiceUnavailableException(),
      ];

      for (const error of exceptions) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(HTTPException);
      }
    });
  });

  describe('Boundary conditions', () => {
    it('should handle status code 0', () => {
      const error = new HTTPException(0, 'Invalid');

      expect(error.statusCode).toBe(0);
    });

    it('should handle status code 999', () => {
      const error = new HTTPException(999, 'Custom');

      expect(error.statusCode).toBe(999);
    });

    it('should handle empty detail string', () => {
      const error = new HTTPException(400, '');

      expect(error.detail).toBe('');
    });

    it('should handle very long detail string', () => {
      const longDetail = 'a'.repeat(10000);
      const error = new HTTPException(400, longDetail);

      expect(error.detail).toBe(longDetail);
      expect(error.detail.length).toBe(10000);
    });
  });
});
