import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { query, testConnection } from '../config/database';
import logger from '../utils/logger';

dotenv.config();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

const seedAdminUser = async () => {
  logger.info('Seeding admin user...');

  const email = 'admin@gt5trading.com';
  const password = 'Admin123!';
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    await query(
      `
      INSERT INTO users (email, password_hash, first_name, last_name, role, account_type, balance)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
      `,
      [email, passwordHash, 'Admin', 'User', 'admin', 'live', '1000000.00']
    );

    logger.info('Admin user seeded successfully', { email });
  } catch (error) {
    logger.error('Failed to seed admin user', { error });
    throw error;
  }
};

const seedDemoUsers = async () => {
  logger.info('Seeding demo users...');

  const demoUsers = [
    {
      email: 'demo@gt5trading.com',
      password: 'Demo123!',
      first_name: 'Demo',
      last_name: 'User',
      balance: '10000.00'
    },
    {
      email: 'trader@gt5trading.com',
      password: 'Trader123!',
      first_name: 'John',
      last_name: 'Trader',
      balance: '25000.00'
    }
  ];

  for (const user of demoUsers) {
    try {
      const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      
      await query(
        `
        INSERT INTO users (email, password_hash, first_name, last_name, role, account_type, balance)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
        `,
        [user.email, passwordHash, user.first_name, user.last_name, 'user', 'demo', user.balance]
      );

      logger.info('Demo user seeded', { email: user.email });
    } catch (error) {
      logger.error('Failed to seed demo user', { email: user.email, error });
    }
  }

  logger.info('Demo users seeded successfully');
};

const runSeed = async () => {
  try {
    logger.info('Starting database seeding...');

    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    await seedAdminUser();
    await seedDemoUsers();

    logger.info('All seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed', { error });
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}

export { runSeed };
