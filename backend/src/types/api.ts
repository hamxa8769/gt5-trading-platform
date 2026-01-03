export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: PublicUser;
}

export interface PublicUser {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  account_type: string;
  balance: string;
  status: string;
  created_at: Date;
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
