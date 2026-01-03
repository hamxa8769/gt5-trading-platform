import { query, getClient } from '../../config/database';
import { Order, OrderWithDetails, CreateOrderData, OrderStatus, OrderType, OrderSide } from '../../types/trading';
import { InternalServerError, ValidationError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
import { executeOrder } from './executionService';

export const createOrder = async (orderData: CreateOrderData): Promise<OrderWithDetails> => {
  const { client, release } = await getClient();
  
  try {
    await client.query('BEGIN');

    // Validate instrument exists
    const instrumentResult = await client.query(
      'SELECT * FROM instruments WHERE id = $1 AND is_active = true',
      [orderData.instrument_id]
    );

    if (instrumentResult.rows.length === 0) {
      throw new NotFoundError('Instrument not found or inactive');
    }

    const instrument = instrumentResult.rows[0];

    // Validate quantity
    const quantity = parseFloat(orderData.quantity);
    if (quantity < parseFloat(instrument.min_quantity) || quantity > parseFloat(instrument.max_quantity)) {
      throw new ValidationError(`Quantity must be between ${instrument.min_quantity} and ${instrument.max_quantity}`);
    }

    // Validate price for limit/stop orders
    if ((orderData.order_type === OrderType.LIMIT || orderData.order_type === OrderType.STOP_LIMIT) && !orderData.price) {
      throw new ValidationError('Price is required for limit orders');
    }

    if ((orderData.order_type === OrderType.STOP || orderData.order_type === OrderType.STOP_LIMIT) && !orderData.stop_price) {
      throw new ValidationError('Stop price is required for stop orders');
    }

    // Check user balance
    const userResult = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [orderData.user_id]
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const balance = parseFloat(userResult.rows[0].balance);
    const estimatedCost = quantity * (orderData.price ? parseFloat(orderData.price) : 0);

    if (orderData.side === OrderSide.BUY && estimatedCost > balance) {
      throw new ValidationError('Insufficient balance');
    }

    // Create order
    const orderResult = await client.query(
      `
      INSERT INTO orders (user_id, instrument_id, order_type, side, quantity, price, stop_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        orderData.user_id,
        orderData.instrument_id,
        orderData.order_type,
        orderData.side,
        orderData.quantity,
        orderData.price || null,
        orderData.stop_price || null,
        orderData.order_type === OrderType.MARKET ? OrderStatus.OPEN : OrderStatus.PENDING
      ]
    );

    const order: Order = orderResult.rows[0];

    // Execute market orders immediately
    if (orderData.order_type === OrderType.MARKET) {
      await executeOrder(order.id, instrument, client);
    }

    await client.query('COMMIT');

    // Fetch order with details
    const detailsResult = await query(
      `
      SELECT o.*, i.symbol, i.name as instrument_name
      FROM orders o
      JOIN instruments i ON o.instrument_id = i.id
      WHERE o.id = $1
      `,
      [order.id]
    );

    logger.info('Order created', { orderId: order.id, userId: orderData.user_id });
    return detailsResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to create order', { error, orderData });
    throw new InternalServerError('Failed to create order');
  } finally {
    release();
  }
};

export const getUserOrders = async (userId: number, limit = 50): Promise<OrderWithDetails[]> => {
  try {
    const result = await query(
      `
      SELECT o.*, i.symbol, i.name as instrument_name
      FROM orders o
      JOIN instruments i ON o.instrument_id = i.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2
      `,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Failed to get user orders', { error, userId });
    throw new InternalServerError('Failed to retrieve orders');
  }
};

export const getOrderById = async (orderId: number, userId: number): Promise<OrderWithDetails> => {
  try {
    const result = await query(
      `
      SELECT o.*, i.symbol, i.name as instrument_name
      FROM orders o
      JOIN instruments i ON o.instrument_id = i.id
      WHERE o.id = $1 AND o.user_id = $2
      `,
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Order not found');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to get order', { error, orderId, userId });
    throw new InternalServerError('Failed to retrieve order');
  }
};

export const cancelOrder = async (orderId: number, userId: number): Promise<OrderWithDetails> => {
  try {
    // Check if order exists and belongs to user
    const checkResult = await query(
      'SELECT status FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Order not found');
    }

    const currentStatus = checkResult.rows[0].status;

    if (currentStatus === OrderStatus.FILLED || currentStatus === OrderStatus.CANCELLED) {
      throw new ValidationError(`Cannot cancel order with status: ${currentStatus}`);
    }

    // Cancel order
    await query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [OrderStatus.CANCELLED, orderId]
    );

    logger.info('Order cancelled', { orderId, userId });
    return await getOrderById(orderId, userId);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Failed to cancel order', { error, orderId, userId });
    throw new InternalServerError('Failed to cancel order');
  }
};
