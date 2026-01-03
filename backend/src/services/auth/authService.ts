import bcrypt from 'bcrypt';
import { query } from '../../config/database';
import { User, CreateUserData, UserRole, AccountType } from '../../types/database';
import { AuthResponse, PublicUser } from '../../types/api';
import { generateTokenPair, verifyToken } from '../../utils/jwt';
import { 
  AuthenticationError, 
  ConflictError, 
  InternalServerError 
} from '../../utils/errors';
import logger from '../../utils/logger';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

const toPublicUser = (user: User): PublicUser => {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    account_type: user.account_type,
    balance: user.balance,
    status: user.status,
    created_at: user.created_at
  };
};

export const register = async (
  email: string,
  password: string,
  first_name?: string,
  last_name?: string
): Promise<AuthResponse> => {
  try {
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const userData: CreateUserData = {
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: first_name || undefined,
      last_name: last_name || undefined,
      role: UserRole.USER,
      account_type: AccountType.DEMO
    };

    const result = await query(
      `
      INSERT INTO users (email, password_hash, first_name, last_name, role, account_type, balance)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.role,
        userData.account_type,
        '10000.00'
      ]
    );

    const user: User = result.rows[0];

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    const tokens = generateTokenPair(user.id, user.email, user.role);

    return {
      ...tokens,
      user: toPublicUser(user)
    };
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }
    logger.error('Registration error', { error, email });
    throw new InternalServerError('Failed to register user');
  }
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('Invalid email or password');
    }

    const user: User = result.rows[0];

    if (user.status !== 'active') {
      throw new AuthenticationError('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    const tokens = generateTokenPair(user.id, user.email, user.role);

    return {
      ...tokens,
      user: toPublicUser(user)
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    logger.error('Login error', { error, email });
    throw new InternalServerError('Failed to login');
  }
};

export const refreshAccessToken = async (refreshToken: string): Promise<AuthResponse> => {
  try {
    const payload = verifyToken(refreshToken, 'refresh');

    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('User not found');
    }

    const user: User = result.rows[0];

    if (user.status !== 'active') {
      throw new AuthenticationError('Account is disabled');
    }

    logger.info('Access token refreshed', { userId: user.id, email: user.email });

    const tokens = generateTokenPair(user.id, user.email, user.role);

    return {
      ...tokens,
      user: toPublicUser(user)
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    logger.error('Token refresh error', { error });
    throw new InternalServerError('Failed to refresh token');
  }
};
