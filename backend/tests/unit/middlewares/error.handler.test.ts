import { describe, it, expect, beforeEach } from 'vitest';
import { Response, Request, NextFunction } from 'express';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
  InternalError,
} from '../../../src/utils/errors';
import { errorHandler } from '../../../src/middlewares/errorHandler';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.jsonData = data;
        return this;
      },
    };
    next = (() => {}) as NextFunction;
  });

  describe('NotFoundError', () => {
    it('should handle 404 errors', () => {
      const error = new NotFoundError('User not found');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('not found');
    });

    it('should return proper response format', () => {
      const error = new NotFoundError('Resource not found');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.jsonData).toHaveProperty('success');
      expect(res.jsonData).toHaveProperty('error');
    });
  });

  describe('ValidationError', () => {
    it('should handle validation errors', () => {
      const error = new ValidationError('Invalid email format');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });

    it('should return 400 status code', () => {
      const error = new ValidationError('Invalid input');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should handle unauthorized errors', () => {
      const error = new UnauthorizedError('Invalid token');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.success).toBe(false);
    });

    it('should return 401 status code', () => {
      const error = new UnauthorizedError('Not authenticated');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('ConflictError', () => {
    it('should handle conflict errors', () => {
      const error = new ConflictError('Email already exists');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(409);
      expect(res.jsonData.success).toBe(false);
    });

    it('should return 409 status code', () => {
      const error = new ConflictError('Duplicate entry');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(409);
    });
  });

  describe('InternalError', () => {
    it('should handle internal server errors', () => {
      const error = new InternalError('Database connection failed');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.success).toBe(false);
    });

    it('should return 500 status code', () => {
      const error = new InternalError('Server error');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(500);
    });
  });

  describe('Generic Error', () => {
    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.success).toBe(false);
    });

    it('should return generic message for unknown errors', () => {
      const error = new Error('Some random error');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.jsonData.error).toBeDefined();
    });
  });

  describe('Response format', () => {
    it('should include success field', () => {
      const error = new ValidationError('Test');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.jsonData.success).toBe(false);
    });

    it('should include error message', () => {
      const error = new ValidationError('Invalid data');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.jsonData.error).toBeDefined();
      expect(typeof res.jsonData.error).toBe('string');
    });

    it('should not expose internal details in production', () => {
      const error = new Error('Database query failed: SELECT * FROM users');

      errorHandler(error, req as Request, res as Response, next);

      // Should not contain SQL in response
      const errorMessage = res.jsonData.error;
      expect(errorMessage).not.toContain('SELECT');
    });
  });

  describe('Error logging', () => {
    it('should handle errors with stack traces', () => {
      const error = new ValidationError('Test error');

      expect(() => {
        errorHandler(error, req as Request, res as Response, next);
      }).not.toThrow();
    });

    it('should handle errors without stack traces', () => {
      const error = { message: 'No stack' } as Error;

      expect(() => {
        errorHandler(error, req as Request, res as Response, next);
      }).not.toThrow();
    });
  });

  describe('Custom error classes', () => {
    it('should identify custom error types', () => {
      const errors = [
        new NotFoundError('Test'),
        new ValidationError('Test'),
        new UnauthorizedError('Test'),
        new ConflictError('Test'),
        new InternalError('Test'),
      ];

      errors.forEach((error) => {
        errorHandler(error, req as Request, res as Response, next);
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
      });
    });
  });

  describe('Status codes', () => {
    const testCases = [
      { error: new NotFoundError(''), expectedCode: 404 },
      { error: new ValidationError(''), expectedCode: 400 },
      { error: new UnauthorizedError(''), expectedCode: 401 },
      { error: new ConflictError(''), expectedCode: 409 },
      { error: new InternalError(''), expectedCode: 500 },
      { error: new Error(''), expectedCode: 500 },
    ];

    testCases.forEach((testCase) => {
      it(`should return ${testCase.expectedCode} for ${testCase.error.constructor.name}`, () => {
        errorHandler(testCase.error, req as Request, res as Response, next);

        expect(res.statusCode).toBe(testCase.expectedCode);
      });
    });
  });
});
