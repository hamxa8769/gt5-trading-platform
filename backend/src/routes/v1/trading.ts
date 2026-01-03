import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import * as orderService from '../../services/trading/orderService';
import * as positionService from '../../services/trading/positionService';
import * as instrumentService from '../../services/trading/instrumentService';
import * as marketDataService from '../../services/trading/marketDataService';
import * as analyticsService from '../../services/trading/analyticsService';
import { CreateOrderData, OrderType, OrderSide } from '../../types/trading';
import { ValidationError } from '../../utils/errors';

const router = Router();

// All trading routes require authentication
router.use(authenticate);

// Get all instruments
router.get('/instruments', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const instruments = await instrumentService.getAllInstruments();
    res.json({ instruments });
  } catch (error) {
    next(error);
  }
});

// Get market data for all instruments
router.get('/market-data', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const marketData = await marketDataService.getAllMarketPrices();
    res.json({ market_data: marketData });
  } catch (error) {
    next(error);
  }
});

// Get market data for specific symbol
router.get('/market-data/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol } = req.params;
    const marketData = await marketDataService.getMarketPrice(symbol.toUpperCase());
    res.json(marketData);
  } catch (error) {
    next(error);
  }
});

// Create order
router.post('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { instrument_id, order_type, side, quantity, price, stop_price } = req.body;

    // Validation
    if (!instrument_id || !order_type || !side || !quantity) {
      throw new ValidationError('Missing required fields: instrument_id, order_type, side, quantity');
    }

    if (!Object.values(OrderType).includes(order_type)) {
      throw new ValidationError('Invalid order_type');
    }

    if (!Object.values(OrderSide).includes(side)) {
      throw new ValidationError('Invalid side');
    }

    const orderData: CreateOrderData = {
      user_id: userId,
      instrument_id: parseInt(instrument_id),
      order_type,
      side,
      quantity: quantity.toString(),
      price: price?.toString(),
      stop_price: stop_price?.toString()
    };

    const order = await orderService.createOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// Get user orders
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const orders = await orderService.getUserOrders(userId, limit);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

// Get specific order
router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const orderId = parseInt(req.params.id);
    
    const order = await orderService.getOrderById(orderId, userId);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Cancel order
router.delete('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const orderId = parseInt(req.params.id);
    
    const order = await orderService.cancelOrder(orderId, userId);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Get user positions
router.get('/positions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const positions = await positionService.getUserPositions(userId);
    res.json({ positions });
  } catch (error) {
    next(error);
  }
});

// Close position
router.post('/positions/:id/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const positionId = parseInt(req.params.id);
    
    await positionService.closePosition(positionId, userId);
    res.json({ message: 'Position closed successfully' });
  } catch (error) {
    next(error);
  }
});

// Get account info
router.get('/account', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { query } = await import('../../config/database');
    
    const userResult = await query(
      'SELECT id, email, first_name, last_name, balance, account_type FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new ValidationError('User not found');
    }

    const user = userResult.rows[0];
    const positions = await positionService.getUserPositions(userId);
    
    const totalUnrealizedPnl = positions.reduce((sum, pos) => 
      sum + parseFloat(pos.unrealized_pnl), 0
    );

    res.json({
      account: {
        ...user,
        equity: (parseFloat(user.balance) + totalUnrealizedPnl).toFixed(2),
        unrealized_pnl: totalUnrealizedPnl.toFixed(2),
        positions_count: positions.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get trade analytics
router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const analytics = await analyticsService.getTradeAnalytics(userId);
    res.json({ analytics });
  } catch (error) {
    next(error);
  }
});

// Get performance metrics
router.get('/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const metrics = await analyticsService.getPerformanceMetrics(userId);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// Get trading history
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 100;
    const history = await analyticsService.getTradingHistory(userId, limit);
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

export default router;
