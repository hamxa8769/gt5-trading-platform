import dotenv from 'dotenv';
import { query, testConnection } from '../config/database';
import logger from '../utils/logger';

dotenv.config();

const createEnumTypes = async () => {
  logger.info('Creating ENUM types...');

  await query(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('user', 'admin');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE account_type AS ENUM ('demo', 'live');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE user_status AS ENUM ('active', 'disabled');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  logger.info('ENUM types created successfully');
};

const createUsersTable = async () => {
  logger.info('Creating users table...');

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      role user_role DEFAULT 'user' NOT NULL,
      account_type account_type DEFAULT 'demo' NOT NULL,
      balance DECIMAL(18, 2) DEFAULT 10000.00 NOT NULL,
      status user_status DEFAULT 'active' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      last_login TIMESTAMP
    );
  `);

  logger.info('Users table created successfully');
};

const createIndexes = async () => {
  logger.info('Creating indexes...');

  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
  `);

  logger.info('Indexes created successfully');
};

const createUpdateTimestampTrigger = async () => {
  logger.info('Creating updated_at trigger...');

  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await query(`
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  `);

  await query(`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  logger.info('Trigger created successfully');
};

const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');

    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    await createEnumTypes();
    await createUsersTable();
    await createIndexes();
    await createUpdateTimestampTrigger();

    logger.info('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  }
};

if (require.main === module) {
  runMigrations();
}

export { runMigrations };
