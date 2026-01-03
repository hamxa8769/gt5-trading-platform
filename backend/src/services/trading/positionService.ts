import { query } from '../../config/database';
import { PositionWithDetails } from '../../types/trading';
import { InternalServerError } from '../../utils/errors';
import logger from '../../utils/logger';
import { getMarketPrice } from './marketDataService';

export const getUserPositions = async (userId: number): Promise<PositionWithDetails[]> => {
  try {
    const result = await query(
      `
      SELECT p.*, i.symbol, i.name as instrument_name
      FROM positions p
      JOIN instruments i ON p.instrument_id = i.id
      WHERE p.user_id = $1 AND p.quantity > 0
      ORDER BY p.opened_at DESC
      `,
      [userId]
    );

    // Update current prices and P&L
    const positions = await Promise.all(
      result.rows.map(async (position) => {
        const marketData = await getMarketPrice(position.symbol);
        const currentPrice = marketData.last;
        const quantity = parseFloat(position.quantity);
        const entryPrice = parseFloat(position.entry_price);
        
        const pnlMultiplier = position.side === 'long' ? 1 : -1;
        const unrealizedPnl = (currentPrice - entryPrice) * quantity * pnlMultiplier;

        // Update position in database
        await query(
          `
          UPDATE positions 
          SET current_price = $1, unrealized_pnl = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          `,
          [currentPrice, unrealizedPnl, position.id]
        );

        return {
          ...position,
          current_price: currentPrice.toString(),
          unrealized_pnl: unrealizedPnl.toFixed(2)
        };
      })
    );

    return positions;
  } catch (error) {
    logger.error('Failed to get user positions', { error, userId });
    throw new InternalServerError('Failed to retrieve positions');
  }
};

export const closePosition = async (positionId: number, userId: number): Promise<void> => {
  try {
    // Update position quantity to 0
    await query(
      `
      UPDATE positions 
      SET quantity = 0, realized_pnl = realized_pnl + unrealized_pnl, unrealized_pnl = 0
      WHERE id = $1 AND user_id = $2
      `,
      [positionId, userId]
    );

    logger.info('Position closed', { positionId, userId });
  } catch (error) {
    logger.error('Failed to close position', { error, positionId, userId });
    throw new InternalServerError('Failed to close position');
  }
};
