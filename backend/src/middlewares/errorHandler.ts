import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    code: (err as any).code,
  });

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input fields',
      details: errors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      message: err.message,
      code: err.code,
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    logger.error('Prisma error code:', prismaErr.code, 'Meta:', prismaErr.meta);

    if (prismaErr.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: `Unique constraint failed on field(s): ${prismaErr.meta.target.join(', ')}`,
        message: `This ${prismaErr.meta.target[0]} is already in use. Please choose a different one.`,
      });
    }

    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
        message: 'The requested record does not exist',
      });
    }

    if (prismaErr.code === 'P2021') {
      return res.status(500).json({
        success: false,
        error: 'Database missing table',
        message: 'A required database table does not exist. Please contact support or restart the backend to sync the database.',
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Database error',
      message: 'A database error occurred while processing your request.',
      details: process.env.NODE_ENV === 'development' ? prismaErr.message : undefined,
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.',
    devDetails: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    message: 'The requested endpoint does not exist',
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
