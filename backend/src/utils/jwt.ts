import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types/api';
import { AuthenticationError } from './errors';

const JWT_SECRET: string = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_ACCESS_EXPIRY: string | number = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY: string | number = process.env.JWT_REFRESH_EXPIRY || '7d';

export const generateAccessToken = (userId: number, email: string, role: string): string => {
  const payload = {
    userId,
    email,
    role,
    type: 'access' as const
  };

  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRY as any,
    issuer: 'gt5-trading-platform'
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

export const generateRefreshToken = (userId: number, email: string, role: string): string => {
  const payload = {
    userId,
    email,
    role,
    type: 'refresh' as const
  };

  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRY as any,
    issuer: 'gt5-trading-platform'
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string, expectedType: 'access' | 'refresh'): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'gt5-trading-platform'
    }) as JWTPayload;

    if (decoded.type !== expectedType) {
      throw new AuthenticationError(`Invalid token type. Expected ${expectedType}`);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw error;
  }
};

export const generateTokenPair = (userId: number, email: string, role: string) => {
  return {
    access_token: generateAccessToken(userId, email, role),
    refresh_token: generateRefreshToken(userId, email, role)
  };
};
