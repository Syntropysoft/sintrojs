/**
 * HTTP Exception classes
 * FastAPI-style exception handling
 */

import type { StringRecord } from './types';

/**
 * Base HTTP Exception class (like FastAPI's HTTPException)
 *
 * @example
 * ```typescript
 * throw new HTTPException(404, 'User not found');
 * ```
 */
export class HTTPException extends Error {
  public readonly statusCode: number;
  public readonly detail: string;
  public readonly headers?: StringRecord;

  constructor(statusCode: number, detail: string, headers?: StringRecord) {
    super(detail);
    this.name = 'HTTPException';
    this.statusCode = statusCode;
    this.detail = detail;
    this.headers = headers;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestException extends HTTPException {
  constructor(detail = 'Bad Request', headers?: StringRecord) {
    super(400, detail, headers);
    this.name = 'BadRequestException';
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedException extends HTTPException {
  constructor(detail = 'Unauthorized', headers?: StringRecord) {
    super(401, detail, headers);
    this.name = 'UnauthorizedException';
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenException extends HTTPException {
  constructor(detail = 'Forbidden', headers?: StringRecord) {
    super(403, detail, headers);
    this.name = 'ForbiddenException';
  }
}

/**
 * 404 Not Found
 */
export class NotFoundException extends HTTPException {
  constructor(detail = 'Not Found', headers?: StringRecord) {
    super(404, detail, headers);
    this.name = 'NotFoundException';
  }
}

/**
 * 409 Conflict
 */
export class ConflictException extends HTTPException {
  constructor(detail = 'Conflict', headers?: StringRecord) {
    super(409, detail, headers);
    this.name = 'ConflictException';
  }
}

/**
 * 422 Unprocessable Entity (Validation Error)
 */
export class ValidationException extends HTTPException {
  public readonly errors: Array<{
    field: string;
    message: string;
  }>;

  constructor(errors: Array<{ field: string; message: string }>, detail = 'Validation Error') {
    super(422, detail);
    this.name = 'ValidationException';
    this.errors = errors;
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerException extends HTTPException {
  constructor(detail = 'Internal Server Error', headers?: StringRecord) {
    super(500, detail, headers);
    this.name = 'InternalServerException';
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableException extends HTTPException {
  constructor(detail = 'Service Unavailable', headers?: StringRecord) {
    super(503, detail, headers);
    this.name = 'ServiceUnavailableException';
  }
}
