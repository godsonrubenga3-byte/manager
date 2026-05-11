export interface MarketData {
  symbol: string;
  price: number;
  change1h: number;
  lastUpdated: string;
}

const marketCache: Record<string, MarketData> = {};
const CACHE_DURATION_MS = 30000; // 30 seconds

export async function fetchMarketData(symbol: string): Promise<MarketData | null> {
  const now = Date.now();
  
  if (marketCache[symbol] && (now - new Date(marketCache[symbol].lastUpdated).getTime() < CACHE_DURATION_MS)) {
    return marketCache[symbol];
  }

  try {
    // Call our serverless Vercel function
    const res = await fetch(`/api/market-data?symbol=${symbol}`);
    if (res.ok) {
      const data = await res.json();
      const marketData: MarketData = {
        symbol: data.symbol,
        price: data.price,
        change1h: data.change1h || 0,
        lastUpdated: new Date().toISOString()
      };
      marketCache[symbol] = marketData;
      return marketData;
    }
  } catch (error) {
    console.error(`Error polling market data for ${symbol}:`, error);
  }

  return marketCache[symbol] || null;
}

