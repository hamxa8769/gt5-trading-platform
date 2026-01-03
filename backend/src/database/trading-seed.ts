import dotenv from 'dotenv';
import { query, testConnection } from '../config/database';
import logger from '../utils/logger';

dotenv.config();

const seedInstruments = async () => {
  logger.info('Seeding trading instruments...');

  const instruments = [
    // Forex pairs
    { symbol: 'EURUSD', name: 'Euro vs US Dollar', type: 'forex', base: 'EUR', quote: 'USD', tick: '0.00001' },
    { symbol: 'GBPUSD', name: 'British Pound vs US Dollar', type: 'forex', base: 'GBP', quote: 'USD', tick: '0.00001' },
    { symbol: 'USDJPY', name: 'US Dollar vs Japanese Yen', type: 'forex', base: 'USD', quote: 'JPY', tick: '0.001' },
    { symbol: 'AUDUSD', name: 'Australian Dollar vs US Dollar', type: 'forex', base: 'AUD', quote: 'USD', tick: '0.00001' },
    { symbol: 'USDCAD', name: 'US Dollar vs Canadian Dollar', type: 'forex', base: 'USD', quote: 'CAD', tick: '0.00001' },
    { symbol: 'USDCHF', name: 'US Dollar vs Swiss Franc', type: 'forex', base: 'USD', quote: 'CHF', tick: '0.00001' },
    // Crypto
    { symbol: 'BTCUSD', name: 'Bitcoin vs US Dollar', type: 'crypto', base: 'BTC', quote: 'USD', tick: '0.01' },
    { symbol: 'ETHUSD', name: 'Ethereum vs US Dollar', type: 'crypto', base: 'ETH', quote: 'USD', tick: '0.01' },
    // Indices
    { symbol: 'US30', name: 'Dow Jones Industrial Average', type: 'index', base: 'US30', quote: 'USD', tick: '1' },
    { symbol: 'SPX500', name: 'S&P 500', type: 'index', base: 'SPX', quote: 'USD', tick: '0.1' },
    { symbol: 'NAS100', name: 'NASDAQ 100', type: 'index', base: 'NAS', quote: 'USD', tick: '0.1' },
    // Commodities
    { symbol: 'XAUUSD', name: 'Gold vs US Dollar', type: 'commodity', base: 'XAU', quote: 'USD', tick: '0.01' },
    { symbol: 'XAGUSD', name: 'Silver vs US Dollar', type: 'commodity', base: 'XAG', quote: 'USD', tick: '0.001' },
    { symbol: 'USOIL', name: 'Crude Oil', type: 'commodity', base: 'OIL', quote: 'USD', tick: '0.01' }
  ];

  for (const inst of instruments) {
    try {
      await query(
        `
        INSERT INTO instruments (symbol, name, type, base_currency, quote_currency, tick_size, min_quantity, max_quantity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (symbol) DO NOTHING
        `,
        [inst.symbol, inst.name, inst.type, inst.base, inst.quote, inst.tick, '0.01', '1000000']
      );
      logger.info('Instrument seeded', { symbol: inst.symbol });
    } catch (error) {
      logger.error('Failed to seed instrument', { symbol: inst.symbol, error });
    }
  }

  logger.info('Trading instruments seeded successfully');
};

const runTradingSeed = async () => {
  try {
    logger.info('Starting trading database seeding...');

    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    await seedInstruments();

    logger.info('All trading seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Trading seeding failed', { error });
    process.exit(1);
  }
};

if (require.main === module) {
  runTradingSeed();
}

export { runTradingSeed };
