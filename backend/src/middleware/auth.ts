import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import logger from '../utils/logger';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const payload = verifyToken(token, 'access');
    req.user = payload;

    logger.debug('User authenticated', { userId: payload.userId, email: payload.email });
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError('Insufficient permissions');
      }

      logger.debug('User authorized', { userId: req.user.userId, role: req.user.role });
      next();
    } catch (error) {
      next(error);
    }
  };
};
