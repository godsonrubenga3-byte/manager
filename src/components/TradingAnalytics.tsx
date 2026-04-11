import React from 'react';
import { Activity, TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import { Trade } from './TradingSimulator';

interface TradingAnalyticsProps {
  trades: Trade[];
  capital: number;
  currency: string;
}

export default function TradingAnalytics({ trades, capital, currency }: TradingAnalyticsProps) {
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalTrades = closedTrades.length;
  
  const winningTrades = closedTrades.filter(t => t.pnl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  
  const pnlByAsset: Record<string, number> = {};
  closedTrades.forEach(t => {
    pnlByAsset[t.asset] = (pnlByAsset[t.asset] || 0) + t.pnl;
  });
  
  let bestAsset = 'N/A';
  let bestPnl = -Infinity;
  Object.entries(pnlByAsset).forEach(([asset, pnl]) => {
    if (pnl > bestPnl) {
      bestPnl = pnl;
      bestAsset = asset;
    }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold px-2 flex items-center gap-2 text-white">
        <Activity className="w-5 h-5 text-primary" />
        Trading Performance
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-2 mb-2 text-stone-500">
            <Target className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-stone-500 mt-1">{winningTrades} of {totalTrades} won</div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-2 mb-2 text-stone-500">
            {totalPnl >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            <span className="text-[10px] font-bold uppercase tracking-widest">Total PnL</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
          </div>
          <div className="text-xs text-stone-500 mt-1">{currency} Realized</div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-2 mb-2 text-stone-500">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Best Asset</span>
          </div>
          <div className="text-xl font-bold text-white truncate">
            {bestAsset}
          </div>
          <div className="text-xs text-stone-500 mt-1">{bestPnl !== -Infinity ? `${bestPnl.toFixed(2)} ${currency}` : 'No data'}</div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-2 mb-2 text-stone-500">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Capital ROI</span>
          </div>
          <div className="text-2xl font-bold text-primary font-mono">
            {capital > 0 ? ((totalPnl / capital) * 100).toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-stone-500 mt-1">Growth</div>
        </div>
      </div>
    </div>
  );
}
