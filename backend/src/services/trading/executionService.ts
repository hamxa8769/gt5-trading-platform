import { PoolClient } from 'pg';
import { OrderStatus, OrderSide, PositionSide } from '../../types/trading';
import { getMarketPrice } from './marketDataService';
import logger from '../../utils/logger';

export const executeOrder = async (orderId: number, instrument: any, client: PoolClient) => {
  try {
    // Get order details
    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderResult.rows[0];

    // Get current market price
    const marketPrice = await getMarketPrice(instrument.symbol);
    const executionPrice = marketPrice.last;

    // Calculate total cost/proceeds
    const quantity = parseFloat(order.quantity);
    const totalValue = quantity * executionPrice;
    const fee = totalValue * 0.001; // 0.1% fee

    // Update user balance
    if (order.side === OrderSide.BUY) {
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [totalValue + fee, order.user_id]
      );
    } else {
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [totalValue - fee, order.user_id]
      );
    }

    // Create trade record
    await client.query(
      `
      INSERT INTO trades (order_id, user_id, instrument_id, side, quantity, price, fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [orderId, order.user_id, order.instrument_id, order.side, order.quantity, executionPrice, fee]
    );

    // Update order status
    await client.query(
      `
      UPDATE orders 
      SET status = $1, filled_quantity = $2, filled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [OrderStatus.FILLED, order.quantity, orderId]
    );

    // Update or create position
    await updatePosition(
      order.user_id,
      order.instrument_id,
      order.side,
      quantity,
      executionPrice,
      client
    );

    logger.info('Order executed', { orderId, executionPrice, quantity });
  } catch (error) {
    logger.error('Failed to execute order', { error, orderId });
    throw error;
  }
};

const updatePosition = async (
  userId: number,
  instrumentId: number,
  orderSide: OrderSide,
  quantity: number,
  price: number,
  client: PoolClient
) => {
  const positionSide = orderSide === OrderSide.BUY ? PositionSide.LONG : PositionSide.SHORT;

  // Check if position exists
  const positionResult = await client.query(
    'SELECT * FROM positions WHERE user_id = $1 AND instrument_id = $2 AND side = $3',
    [userId, instrumentId, positionSide]
  );

  if (positionResult.rows.length > 0) {
    // Update existing position
    const position = positionResult.rows[0];
    const currentQty = parseFloat(position.quantity);
    const currentEntry = parseFloat(position.entry_price);
    
    const newQty = currentQty + quantity;
    const newEntry = ((currentQty * currentEntry) + (quantity * price)) / newQty;

    await client.query(
      `
      UPDATE positions 
      SET quantity = $1, entry_price = $2, current_price = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      `,
      [newQty, newEntry, price, position.id]
    );
  } else {
    // Create new position
    await client.query(
      `
      INSERT INTO positions (user_id, instrument_id, side, quantity, entry_price, current_price)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [userId, instrumentId, positionSide, quantity, price, price]
    );
  }
};
