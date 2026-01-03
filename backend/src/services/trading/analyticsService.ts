import { query } from '../../config/database';
import { InternalServerError } from '../../utils/errors';
import logger from '../../utils/logger';

export interface TradeAnalytics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_profit: number;
  total_loss: number;
  net_profit: number;
  average_win: number;
  average_loss: number;
  largest_win: number;
  largest_loss: number;
  profit_factor: number;
  sharpe_ratio: number;
}

export interface PerformanceMetrics {
  today: {
    trades: number;
    profit: number;
    win_rate: number;
  };
  week: {
    trades: number;
    profit: number;
    win_rate: number;
  };
  month: {
    trades: number;
    profit: number;
    win_rate: number;
  };
  all_time: TradeAnalytics;
}

export const getTradeAnalytics = async (userId: number): Promise<TradeAnalytics> => {
  try {
    // Get all completed trades for user
    const tradesResult = await query(
      `
      SELECT 
        t.quantity, 
        t.price, 
        t.side,
        t.fee,
        o.side as order_side,
        i.symbol
      FROM trades t
      JOIN orders o ON t.order_id = o.id
      JOIN instruments i ON t.instrument_id = i.id
      WHERE t.user_id = $1
      ORDER BY t.created_at ASC
      `,
      [userId]
    );

    const trades = tradesResult.rows;
    
    if (trades.length === 0) {
      return {
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        total_profit: 0,
        total_loss: 0,
        net_profit: 0,
        average_win: 0,
        average_loss: 0,
        largest_win: 0,
        largest_loss: 0,
        profit_factor: 0,
        sharpe_ratio: 0
      };
    }

    // Calculate P&L for each trade
    const tradePnL: number[] = [];
    const positions: { [symbol: string]: { quantity: number; avgPrice: number; side: string } } = {};

    trades.forEach(trade => {
      const symbol = trade.symbol;
      const quantity = parseFloat(trade.quantity);
      const price = parseFloat(trade.price);
      const side = trade.side;

      if (!positions[symbol]) {
        positions[symbol] = { quantity: 0, avgPrice: 0, side: '' };
      }

      const pos = positions[symbol];

      // Calculate P&L when closing/reducing position
      if (pos.quantity > 0 && side !== pos.side) {
        const closeQuantity = Math.min(quantity, pos.quantity);
        const pnl = pos.side === 'buy' 
          ? (price - pos.avgPrice) * closeQuantity
          : (pos.avgPrice - price) * closeQuantity;
        
        tradePnL.push(pnl);
        pos.quantity -= closeQuantity;
        
        if (pos.quantity <= 0) {
          pos.quantity = quantity - closeQuantity;
          pos.avgPrice = price;
          pos.side = side;
        }
      } else {
        // Opening or adding to position
        if (pos.quantity === 0) {
          pos.quantity = quantity;
          pos.avgPrice = price;
          pos.side = side;
        } else {
          pos.avgPrice = ((pos.avgPrice * pos.quantity) + (price * quantity)) / (pos.quantity + quantity);
          pos.quantity += quantity;
        }
      }
    });

    const winningTrades = tradePnL.filter(pnl => pnl > 0);
    const losingTrades = tradePnL.filter(pnl => pnl < 0);
    
    const totalProfit = winningTrades.reduce((sum, pnl) => sum + pnl, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, pnl) => sum + pnl, 0));
    const netProfit = totalProfit - totalLoss;
    
    const winRate = tradePnL.length > 0 ? (winningTrades.length / tradePnL.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades) : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    // Simple Sharpe ratio calculation (simplified)
    const avgReturn = tradePnL.length > 0 ? tradePnL.reduce((sum, pnl) => sum + pnl, 0) / tradePnL.length : 0;
    const variance = tradePnL.length > 0 
      ? tradePnL.reduce((sum, pnl) => sum + Math.pow(pnl - avgReturn, 2), 0) / tradePnL.length 
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) : 0;

    return {
      total_trades: tradePnL.length,
      winning_trades: winningTrades.length,
      losing_trades: losingTrades.length,
      win_rate: parseFloat(winRate.toFixed(2)),
      total_profit: parseFloat(totalProfit.toFixed(2)),
      total_loss: parseFloat(totalLoss.toFixed(2)),
      net_profit: parseFloat(netProfit.toFixed(2)),
      average_win: parseFloat(avgWin.toFixed(2)),
      average_loss: parseFloat(avgLoss.toFixed(2)),
      largest_win: parseFloat(largestWin.toFixed(2)),
      largest_loss: parseFloat(largestLoss.toFixed(2)),
      profit_factor: parseFloat(profitFactor.toFixed(2)),
      sharpe_ratio: parseFloat(sharpeRatio.toFixed(2))
    };
  } catch (error) {
    logger.error('Failed to get trade analytics', { error, userId });
    throw new InternalServerError('Failed to retrieve analytics');
  }
};

export const getPerformanceMetrics = async (userId: number): Promise<PerformanceMetrics> => {
  try {
    const today = await getAnalyticsForPeriod(userId, '1 day');
    const week = await getAnalyticsForPeriod(userId, '7 days');
    const month = await getAnalyticsForPeriod(userId, '30 days');
    const allTime = await getTradeAnalytics(userId);

    return {
      today: {
        trades: today.total_trades,
        profit: today.net_profit,
        win_rate: today.win_rate
      },
      week: {
        trades: week.total_trades,
        profit: week.net_profit,
        win_rate: week.win_rate
      },
      month: {
        trades: month.total_trades,
        profit: month.net_profit,
        win_rate: month.win_rate
      },
      all_time: allTime
    };
  } catch (error) {
    logger.error('Failed to get performance metrics', { error, userId });
    throw new InternalServerError('Failed to retrieve performance metrics');
  }
};

const getAnalyticsForPeriod = async (userId: number, period: string): Promise<TradeAnalytics> => {
  try {
    const tradesResult = await query(
      `
      SELECT 
        t.quantity, 
        t.price, 
        t.side,
        t.fee
      FROM trades t
      WHERE t.user_id = $1 
        AND t.created_at >= NOW() - INTERVAL '${period}'
      `,
      [userId]
    );

    // Similar calculation as getTradeAnalytics but for specific period
    // Simplified version for now
    const trades = tradesResult.rows;
    
    if (trades.length === 0) {
      return {
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        total_profit: 0,
        total_loss: 0,
        net_profit: 0,
        average_win: 0,
        average_loss: 0,
        largest_win: 0,
        largest_loss: 0,
        profit_factor: 0,
        sharpe_ratio: 0
      };
    }

    return {
      total_trades: trades.length,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      total_profit: 0,
      total_loss: 0,
      net_profit: 0,
      average_win: 0,
      average_loss: 0,
      largest_win: 0,
      largest_loss: 0,
      profit_factor: 0,
      sharpe_ratio: 0
    };
  } catch (error) {
    logger.error('Failed to get period analytics', { error, userId, period });
    throw new InternalServerError('Failed to retrieve period analytics');
  }
};

export const getTradingHistory = async (userId: number, limit = 100) => {
  try {
    const result = await query(
      `
      SELECT 
        t.id,
        t.quantity,
        t.price,
        t.side,
        t.fee,
        t.created_at,
        i.symbol,
        i.name as instrument_name,
        o.order_type
      FROM trades t
      JOIN instruments i ON t.instrument_id = i.id
      JOIN orders o ON t.order_id = o.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2
      `,
      [userId, limit]
    );

    return result.rows.map(trade => ({
      ...trade,
      total_value: (parseFloat(trade.quantity) * parseFloat(trade.price)).toFixed(2),
      net_value: (parseFloat(trade.quantity) * parseFloat(trade.price) - parseFloat(trade.fee)).toFixed(2)
    }));
  } catch (error) {
    logger.error('Failed to get trading history', { error, userId });
    throw new InternalServerError('Failed to retrieve trading history');
  }
};
