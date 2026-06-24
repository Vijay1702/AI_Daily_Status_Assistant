import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
        masterNo: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      masterNo: string;
    };

    req.userId = decoded.id;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired');
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (error instanceof UnauthorizedError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as {
          id: string;
          email: string;
          masterNo: string;
        };

        req.userId = decoded.id;
        req.user = decoded;
      } catch (error) {
        logger.warn('Optional auth failed:', error);
        // Continue without authentication
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
}
