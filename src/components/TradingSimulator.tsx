import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, DollarSign, TrendingDown, TrendingUp, X } from 'lucide-react';
import { triggerNotification } from '../utils/notifications';

export interface Trade {
  id: number;
  asset: string;
  direction: 'Long' | 'Short';
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  margin_invested: number;
  status: 'open' | 'closed';
  pnl: number;
  created_at: string;
  closed_at?: string;
}

interface TradingSimulatorProps {
  capital: number;
  trades: Trade[];
  livePrices: Record<string, number | null>;
  onPlaceTrade: (trade: Omit<Trade, 'id' | 'status' | 'pnl' | 'created_at'>) => void;
  onCloseTrade: (id: number, pnl: number) => void;
  currency: string;
}

const ASSETS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin (Binance)', native: 'USD' },
  { symbol: 'BBTCUSD', name: 'Wrapped BTC (Proxy)', native: 'USD' },
  { symbol: 'GBPJPY', name: 'GBP/JPY (Forex)', native: 'JPY' },
  { symbol: 'XAUUSD', name: 'Gold (PAXG Proxy)', native: 'USD' },
  { symbol: 'UMJATZS', name: 'UMOJA Fund (UTT)', native: 'TZS' },
];

export default function TradingSimulator({ capital, trades, livePrices, onPlaceTrade, onCloseTrade, currency }: TradingSimulatorProps) {
  const [asset, setAsset] = useState(ASSETS[0].symbol);
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [margin, setMargin] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [leverage, setLeverage] = useState('1');

  // Auto-fill entry price when asset changes or live price updates (if not manually edited)
  useEffect(() => {
    if (livePrices[asset] && !entryPrice) {
      setEntryPrice(livePrices[asset]!.toString());
    }
  }, [asset, livePrices]);

  // Monitor Open Trades for TP / SL Hits
  useEffect(() => {
    const openTrades = trades.filter(t => t.status === 'open');
    openTrades.forEach(trade => {
      const currentPrice = livePrices[trade.asset];
      if (!currentPrice) return;

      let hitType: 'TP' | 'SL' | null = null;
      
      if (trade.direction === 'Long') {
        if (currentPrice >= trade.take_profit) hitType = 'TP';
        else if (currentPrice <= trade.stop_loss) hitType = 'SL';
      } else {
        if (currentPrice <= trade.take_profit) hitType = 'TP';
        else if (currentPrice >= trade.stop_loss) hitType = 'SL';
      }

      if (hitType) {
        // Calculate PnL
        const entry = trade.entry_price;
        const exit = currentPrice;
        const priceDiff = trade.direction === 'Long' ? (exit - entry) / entry : (entry - exit) / entry;
        const finalPnl = trade.margin_invested * priceDiff * parseFloat(leverage || '1'); // Simplified leverage math

        onCloseTrade(trade.id, finalPnl);
        
        triggerNotification(
          `Trade Closed: ${trade.asset}`,
          `Your ${trade.direction} hit ${hitType}! PnL: ${finalPnl >= 0 ? '+' : ''}${finalPnl.toFixed(2)} ${currency}`
        );
      }
    });
  }, [livePrices, trades, onCloseTrade, currency, leverage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const marginNum = parseFloat(margin);
    if (!marginNum || marginNum <= 0) return;
    
    // Calculate total margin in use
    const usedMargin = trades.filter(t => t.status === 'open').reduce((sum, t) => sum + t.margin_invested, 0);
    if (marginNum + usedMargin > capital) {
      alert("Insufficient Trading Capital. Please allocate more funds in the settings or close active trades.");
      return;
    }

    onPlaceTrade({
      asset,
      direction,
      entry_price: parseFloat(entryPrice) || (livePrices[asset] || 0),
      take_profit: parseFloat(takeProfit),
      stop_loss: parseFloat(stopLoss),
      margin_invested: marginNum,
    });

    setMargin('');
    setTakeProfit('');
    setStopLoss('');
  };

  const activeTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalUsedMargin = activeTrades.reduce((sum, t) => sum + t.margin_invested, 0);

  return (
    <div className="space-y-6">
      {/* Capital Status */}
      <div className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Trading Account</h3>
          <div className="text-3xl font-bold font-mono text-white">
            <span className="text-stone-500 text-sm mr-1">{currency}</span>
            {(capital + trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + t.pnl, 0)).toFixed(2)}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-widest">In Margin</div>
            <div className="text-lg font-bold font-mono text-amber-500">{totalUsedMargin.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-widest">Available</div>
            <div className="text-lg font-bold font-mono text-emerald-500">{(capital - totalUsedMargin).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Trading Form */}
      <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            New Order
          </h2>
          {livePrices[asset] ? (
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-sm font-mono font-bold text-emerald-400">
              Live: {ASSETS.find(a => a.symbol === asset)?.native === 'TZS' ? 'TSh' : '$'}{livePrices[asset]?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          ) : (
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-sm font-mono font-bold text-stone-500">
              Loading...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Asset</label>
            <select
              value={asset}
              onChange={(e) => { setAsset(e.target.value); setEntryPrice(''); }}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/30"
            >
              {ASSETS.map(a => <option key={a.symbol} value={a.symbol} className="bg-card-dark">{a.name} ({a.symbol})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Direction</label>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 h-[46px]">
              <button
                type="button"
                onClick={() => setDirection('Long')}
                className={`flex-1 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${direction === 'Long' ? 'bg-emerald-500 shadow-lg text-white' : 'text-stone-500 hover:text-stone-300'}`}
              >
                <TrendingUp className="w-4 h-4" /> Long
              </button>
              <button
                type="button"
                onClick={() => setDirection('Short')}
                className={`flex-1 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${direction === 'Short' ? 'bg-red-500 shadow-lg text-white' : 'text-stone-500 hover:text-stone-300'}`}
              >
                <TrendingDown className="w-4 h-4" /> Short
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Margin ({currency})</label>
            <input type="number" step="0.01" required value={margin} onChange={e => setMargin(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/30" placeholder="Amount to risk" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Leverage</label>
            <input type="number" step="1" min="1" max="100" value={leverage} onChange={e => setLeverage(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/30" placeholder="1x" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Entry Price</label>
            <input type="number" step="0.00000001" required value={entryPrice} onChange={e => setEntryPrice(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-bold text-emerald-500 uppercase mb-2">Take Profit</label>
            <input type="number" step="0.00000001" required value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono placeholder:text-emerald-500/30" placeholder="Target Price" />
          </div>
          <div>
            <label className="block text-xs font-bold text-red-500 uppercase mb-2">Stop Loss</label>
            <input type="number" step="0.00000001" required value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="w-full px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 outline-none focus:ring-2 focus:ring-red-500/30 font-mono placeholder:text-red-500/30" placeholder="Loss Limit" />
          </div>
        </div>

        <button type="submit" disabled={capital <= 0} className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg text-lg flex items-center justify-center gap-2 ${direction === 'Long' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'} disabled:opacity-50 disabled:grayscale`}>
          {capital <= 0 ? 'Add Funds to Trade' : `Place ${direction} Order`}
        </button>
      </form>

      {/* Active Orders */}
      <div className="glass p-6 rounded-3xl border border-white/5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" /> Active Orders
        </h3>
        <div className="space-y-3">
          {activeTrades.length === 0 ? (
            <div className="text-center py-6 text-stone-600 italic text-sm">No active trades.</div>
          ) : (
            activeTrades.map(trade => {
              const currentPrice = livePrices[trade.asset];
              let unrealizedPnl = 0;
              if (currentPrice) {
                const diff = trade.direction === 'Long' ? (currentPrice - trade.entry_price) / trade.entry_price : (trade.entry_price - currentPrice) / trade.entry_price;
                unrealizedPnl = trade.margin_invested * diff * parseFloat(leverage || '1');
              }
              const isProfit = unrealizedPnl >= 0;

              return (
                <div key={trade.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${trade.direction === 'Long' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        {trade.direction}
                      </span>
                      <span className="font-bold text-white text-sm">{trade.asset}</span>
                    </div>
                    <div className="text-xs text-stone-500 font-mono">
                      Entry: {trade.entry_price.toFixed(4)} | Margin: {currency}{trade.margin_invested.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold font-mono ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isProfit ? '+' : ''}{unrealizedPnl.toFixed(2)} {currency}
                    </div>
                    <div className="text-xs text-stone-500 uppercase tracking-widest font-bold">Unrealized PnL</div>
                  </div>
                  <button 
                    onClick={() => onCloseTrade(trade.id, unrealizedPnl)}
                    className="px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 border border-white/10 rounded-lg text-xs font-bold text-stone-300 transition-all"
                  >
                    Close Position
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Order History */}
      <div className="glass p-6 rounded-3xl border border-white/5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-stone-500" /> Order History
        </h3>
        <div className="space-y-3">
          {closedTrades.slice(0, 10).map(trade => (
             <div key={trade.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className="font-bold text-white text-sm">{trade.asset}</span>
                   <span className="text-xs text-stone-500">{trade.direction}</span>
                 </div>
                 <div className="text-xs text-stone-500">
                   Closed: {new Date(trade.closed_at!).toLocaleString()}
                 </div>
               </div>
               <div className={`text-sm font-bold font-mono ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                 {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} {currency}
               </div>
             </div>
          ))}
          {closedTrades.length > 10 && <div className="text-center text-xs text-stone-500 py-2">Showing last 10 trades</div>}
          {closedTrades.length === 0 && <div className="text-center py-6 text-stone-600 italic text-sm">No closed trades yet.</div>}
        </div>
      </div>
    </div>
  );
}
