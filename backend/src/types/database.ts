export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum AccountType {
  DEMO = 'demo',
  LIVE = 'live'
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  account_type: AccountType;
  balance: string;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  account_type?: AccountType;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  balance?: string;
  status?: UserStatus;
  last_login?: Date;
}
