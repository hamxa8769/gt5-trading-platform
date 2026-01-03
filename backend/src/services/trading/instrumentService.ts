import { query } from '../../config/database';
import { Instrument } from '../../types/trading';
import { InternalServerError } from '../../utils/errors';
import logger from '../../utils/logger';

export const getAllInstruments = async (): Promise<Instrument[]> => {
  try {
    const result = await query(
      'SELECT * FROM instruments WHERE is_active = true ORDER BY symbol'
    );
    return result.rows;
  } catch (error) {
    logger.error('Failed to get instruments', { error });
    throw new InternalServerError('Failed to retrieve instruments');
  }
};

export const getInstrumentBySymbol = async (symbol: string): Promise<Instrument | null> => {
  try {
    const result = await query(
      'SELECT * FROM instruments WHERE symbol = $1 AND is_active = true',
      [symbol]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Failed to get instrument', { error, symbol });
    throw new InternalServerError('Failed to retrieve instrument');
  }
};
