import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ErrorResponse } from '../types/api';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      error: {
        message: err.message,
        code: err.code
      }
    };

    if (err.isOperational) {
      logger.warn('Operational error', {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method
      });
    } else {
      logger.error('Non-operational error', {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack,
        path: req.path,
        method: req.method
      });
    }

    return res.status(err.statusCode).json(errorResponse);
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const errorResponse: ErrorResponse = {
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
      code: 'INTERNAL_SERVER_ERROR'
    }
  };

  return res.status(500).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const errorResponse: ErrorResponse = {
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND'
    }
  };

  logger.warn('Route not found', {
    method: req.method,
    path: req.path
  });

  return res.status(404).json(errorResponse);
};
