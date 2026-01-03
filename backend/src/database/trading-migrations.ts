import dotenv from 'dotenv';
import { query, testConnection } from '../config/database';
import logger from '../utils/logger';

dotenv.config();

const createEnumTypes = async () => {
  logger.info('Creating trading ENUM types...');

  await query(`
    DO $$ BEGIN
      CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop', 'stop_limit');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE order_side AS ENUM ('buy', 'sell');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE order_status AS ENUM ('pending', 'open', 'filled', 'partially_filled', 'cancelled', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      CREATE TYPE position_side AS ENUM ('long', 'short');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  logger.info('Trading ENUM types created successfully');
};

const createInstrumentsTable = async () => {
  logger.info('Creating instruments table...');

  await query(`
    CREATE TABLE IF NOT EXISTS instruments (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) DEFAULT 'forex' NOT NULL,
      base_currency VARCHAR(10) NOT NULL,
      quote_currency VARCHAR(10) NOT NULL,
      min_quantity DECIMAL(18, 8) DEFAULT 0.01 NOT NULL,
      max_quantity DECIMAL(18, 8) DEFAULT 1000000 NOT NULL,
      tick_size DECIMAL(18, 8) DEFAULT 0.00001 NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);

  logger.info('Instruments table created successfully');
};

const createOrdersTable = async () => {
  logger.info('Creating orders table...');

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
      order_type order_type NOT NULL,
      side order_side NOT NULL,
      quantity DECIMAL(18, 8) NOT NULL,
      price DECIMAL(18, 8),
      stop_price DECIMAL(18, 8),
      filled_quantity DECIMAL(18, 8) DEFAULT 0 NOT NULL,
      status order_status DEFAULT 'pending' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      filled_at TIMESTAMP
    );
  `);

  logger.info('Orders table created successfully');
};

const createPositionsTable = async () => {
  logger.info('Creating positions table...');

  await query(`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
      side position_side NOT NULL,
      quantity DECIMAL(18, 8) NOT NULL,
      entry_price DECIMAL(18, 8) NOT NULL,
      current_price DECIMAL(18, 8) NOT NULL,
      unrealized_pnl DECIMAL(18, 2) DEFAULT 0 NOT NULL,
      realized_pnl DECIMAL(18, 2) DEFAULT 0 NOT NULL,
      opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      UNIQUE(user_id, instrument_id, side)
    );
  `);

  logger.info('Positions table created successfully');
};

const createTradesTable = async () => {
  logger.info('Creating trades table...');

  await query(`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
      side order_side NOT NULL,
      quantity DECIMAL(18, 8) NOT NULL,
      price DECIMAL(18, 8) NOT NULL,
      fee DECIMAL(18, 2) DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);

  logger.info('Trades table created successfully');
};

const createIndexes = async () => {
  logger.info('Creating trading indexes...');

  await query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_trades_order_id ON trades(order_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments(symbol);`);

  logger.info('Trading indexes created successfully');
};

const createTriggers = async () => {
  logger.info('Creating trading triggers...');

  await query(`
    DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
  `);

  await query(`
    CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  await query(`
    DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
  `);

  await query(`
    CREATE TRIGGER update_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  logger.info('Trading triggers created successfully');
};

const runTradingMigrations = async () => {
  try {
    logger.info('Starting trading database migrations...');

    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    await createEnumTypes();
    await createInstrumentsTable();
    await createOrdersTable();
    await createPositionsTable();
    await createTradesTable();
    await createIndexes();
    await createTriggers();

    logger.info('All trading migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Trading migration failed', { error });
    process.exit(1);
  }
};

if (require.main === module) {
  runTradingMigrations();
}

export { runTradingMigrations };
