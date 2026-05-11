import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    let url = '';
    
    // Binance 24h ticker (contains last price and 1h data is usually inferred or fetched via candles)
    // For a quick "1h timeframe" we fetch the 1h klines (candles)
    if (symbol.includes('USDT') || symbol.includes('USD')) {
        const binanceSymbol = symbol.replace('USD', 'USDT');
        url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1h&limit=2`;
    } 
    else if (symbol === 'GBPJPY') {
        url = `https://api.frankfurter.app/latest?from=GBP&to=JPY`;
    }

    if (!url) return res.status(400).json({ error: 'Unsupported symbol' });

    const response = await fetch(url);
    const data = await response.json();

    let price = 0;
    let change1h = 0;

    if (Array.isArray(data)) { // Binance Klines
        const currentCandle = data[1] || data[0];
        const prevCandle = data[0];
        price = parseFloat(currentCandle[4]); // Close price
        const openPrice = parseFloat(currentCandle[1]);
        change1h = ((price - openPrice) / openPrice) * 100;
    } else if (data.rates) { // Frankfurter
        price = data.rates.JPY;
        change1h = 0; // Frankfurter doesn't easily provide 1h change in one call
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ symbol, price, change1h });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}
