export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit'
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell'
}

export enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open',
  FILLED = 'filled',
  PARTIALLY_FILLED = 'partially_filled',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

export enum PositionSide {
  LONG = 'long',
  SHORT = 'short'
}

export interface Instrument {
  id: number;
  symbol: string;
  name: string;
  type: string;
  base_currency: string;
  quote_currency: string;
  min_quantity: string;
  max_quantity: string;
  tick_size: string;
  is_active: boolean;
  created_at: Date;
}

export interface Order {
  id: number;
  user_id: number;
  instrument_id: number;
  order_type: OrderType;
  side: OrderSide;
  quantity: string;
  price: string | null;
  stop_price: string | null;
  filled_quantity: string;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
  filled_at: Date | null;
}

export interface Position {
  id: number;
  user_id: number;
  instrument_id: number;
  side: PositionSide;
  quantity: string;
  entry_price: string;
  current_price: string;
  unrealized_pnl: string;
  realized_pnl: string;
  opened_at: Date;
  updated_at: Date;
}

export interface Trade {
  id: number;
  order_id: number;
  user_id: number;
  instrument_id: number;
  side: OrderSide;
  quantity: string;
  price: string;
  fee: string;
  created_at: Date;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

export interface CreateOrderData {
  user_id: number;
  instrument_id: number;
  order_type: OrderType;
  side: OrderSide;
  quantity: string;
  price?: string;
  stop_price?: string;
}

export interface OrderWithDetails extends Order {
  symbol: string;
  instrument_name: string;
}

export interface PositionWithDetails extends Position {
  symbol: string;
  instrument_name: string;
}
