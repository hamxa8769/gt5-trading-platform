import { MarketData } from '../../types/trading';

// Simulated market data - in production, this would fetch from real market data providers
const marketPrices: { [key: string]: MarketData } = {
  'EURUSD': { symbol: 'EURUSD', bid: 1.0850, ask: 1.0852, last: 1.0851, high: 1.0870, low: 1.0830, volume: 1000000, timestamp: new Date() },
  'GBPUSD': { symbol: 'GBPUSD', bid: 1.2650, ask: 1.2652, last: 1.2651, high: 1.2680, low: 1.2620, volume: 800000, timestamp: new Date() },
  'USDJPY': { symbol: 'USDJPY', bid: 149.50, ask: 149.52, last: 149.51, high: 150.00, low: 149.00, volume: 900000, timestamp: new Date() },
  'AUDUSD': { symbol: 'AUDUSD', bid: 0.6550, ask: 0.6552, last: 0.6551, high: 0.6580, low: 0.6520, volume: 600000, timestamp: new Date() },
  'USDCAD': { symbol: 'USDCAD', bid: 1.3550, ask: 1.3552, last: 1.3551, high: 1.3580, low: 1.3520, volume: 500000, timestamp: new Date() },
  'USDCHF': { symbol: 'USDCHF', bid: 0.8850, ask: 0.8852, last: 0.8851, high: 0.8880, low: 0.8820, volume: 450000, timestamp: new Date() },
  'BTCUSD': { symbol: 'BTCUSD', bid: 43500, ask: 43550, last: 43525, high: 44000, low: 43000, volume: 50000, timestamp: new Date() },
  'ETHUSD': { symbol: 'ETHUSD', bid: 2280, ask: 2285, last: 2282, high: 2320, low: 2250, volume: 100000, timestamp: new Date() },
  'US30': { symbol: 'US30', bid: 38500, ask: 38505, last: 38502, high: 38800, low: 38200, volume: 250000, timestamp: new Date() },
  'SPX500': { symbol: 'SPX500', bid: 4950, ask: 4952, last: 4951, high: 4980, low: 4920, volume: 300000, timestamp: new Date() },
  'NAS100': { symbol: 'NAS100', bid: 17200, ask: 17205, last: 17202, high: 17350, low: 17100, volume: 280000, timestamp: new Date() },
  'XAUUSD': { symbol: 'XAUUSD', bid: 2050, ask: 2052, last: 2051, high: 2070, low: 2040, volume: 150000, timestamp: new Date() },
  'XAGUSD': { symbol: 'XAGUSD', bid: 24.50, ask: 24.52, last: 24.51, high: 24.80, low: 24.20, volume: 200000, timestamp: new Date() },
  'USOIL': { symbol: 'USOIL', bid: 78.50, ask: 78.55, last: 78.52, high: 79.50, low: 77.50, volume: 180000, timestamp: new Date() }
};

// Simulate price movements
setInterval(() => {
  Object.keys(marketPrices).forEach(symbol => {
    const data = marketPrices[symbol];
    const volatility = data.last * 0.0002; // 0.02% volatility
    const change = (Math.random() - 0.5) * 2 * volatility;
    
    data.last = +(data.last + change).toFixed(symbol === 'USDJPY' ? 2 : symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('ETH') ? 4 : 2);
    data.bid = +(data.last - data.last * 0.0001).toFixed(symbol === 'USDJPY' ? 2 : symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('ETH') ? 4 : 2);
    data.ask = +(data.last + data.last * 0.0001).toFixed(symbol === 'USDJPY' ? 2 : symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('ETH') ? 4 : 2);
    data.high = Math.max(data.high, data.last);
    data.low = Math.min(data.low, data.last);
    data.timestamp = new Date();
  });
}, 1000);

export const getMarketPrice = async (symbol: string): Promise<MarketData> => {
  const data = marketPrices[symbol];
  if (!data) {
    // Return default data if symbol not found
    return {
      symbol,
      bid: 1.0,
      ask: 1.0,
      last: 1.0,
      high: 1.0,
      low: 1.0,
      volume: 0,
      timestamp: new Date()
    };
  }
  return { ...data };
};

export const getAllMarketPrices = async (): Promise<MarketData[]> => {
  return Object.values(marketPrices).map(data => ({ ...data }));
};

export const subscribeToMarketData = (callback: (data: MarketData[]) => void) => {
  const interval = setInterval(() => {
    callback(Object.values(marketPrices).map(data => ({ ...data })));
  }, 1000);

  return () => clearInterval(interval);
};
