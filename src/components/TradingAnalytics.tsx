import React from 'react';
import { Activity, TrendingUp, TrendingDown, Target, Award, PieChart, BarChart3, ShieldCheck, Zap } from 'lucide-react';
import { Trade } from './TradingJournal';

interface TradingAnalyticsProps {
  trades: Trade[];
  capital: number;
  currency: string;
}

export default function TradingAnalytics({ trades, capital, currency }: TradingAnalyticsProps) {
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalTrades = closedTrades.length;
  
  const winningTrades = closedTrades.filter(t => t.pnl > 0);
  const losingTrades = closedTrades.filter(t => t.pnl < 0);
  
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? '∞' : '0.00';
  
  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  const riskRewardRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '0.00';

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
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white light-theme:text-text-light">
            <Activity className="w-6 h-6 text-primary" />
            Performance Analytics
        </h2>
        <div className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 bg-white/5 light-theme:bg-black/5 px-2 py-1 rounded-full uppercase tracking-widest border border-white/5 light-theme:border-black/5">
            {totalTrades} Total Trades
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/5 light-theme:border-black/5 bg-white/[0.02] light-theme:bg-black/[0.01] hover:bg-white/[0.04] light-theme:hover:bg-black/[0.03] transition-all">
          <div className="flex items-center gap-2 mb-2 text-stone-500 light-theme:text-stone-600">
            <Target className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-white light-theme:text-text-light font-mono">
            {winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-stone-500 light-theme:text-stone-600 mt-1 uppercase font-bold">{winningTrades.length} W / {losingTrades.length} L</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 light-theme:border-black/5 bg-white/[0.02] light-theme:bg-black/[0.01] hover:bg-white/[0.04] light-theme:hover:bg-black/[0.03] transition-all">
          <div className="flex items-center gap-2 mb-2 text-stone-500 light-theme:text-stone-600">
            {totalPnl >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            <span className="text-[10px] font-bold uppercase tracking-widest">Net Profit</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
          </div>
          <div className="text-[10px] text-stone-500 light-theme:text-stone-600 mt-1 uppercase font-bold">{currency} Realized</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 light-theme:border-black/5 bg-white/[0.02] light-theme:bg-black/[0.01] hover:bg-white/[0.04] light-theme:hover:bg-black/[0.03] transition-all">
          <div className="flex items-center gap-2 mb-2 text-stone-500 light-theme:text-stone-600">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Profit Factor</span>
          </div>
          <div className="text-2xl font-bold text-white light-theme:text-text-light font-mono">
            {profitFactor}
          </div>
          <div className="text-[10px] text-stone-500 light-theme:text-stone-600 mt-1 uppercase font-bold">Gross P/L Ratio</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 light-theme:border-black/5 bg-white/[0.02] light-theme:bg-black/[0.01] hover:bg-white/[0.04] light-theme:hover:bg-black/[0.03] transition-all">
          <div className="flex items-center gap-2 mb-2 text-stone-500 light-theme:text-stone-600">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Risk/Reward</span>
          </div>
          <div className="text-2xl font-bold text-white light-theme:text-text-light font-mono">
            1:{riskRewardRatio}
          </div>
          <div className="text-[10px] text-stone-500 light-theme:text-stone-600 mt-1 uppercase font-bold">Avg Win/Loss</div>
        </div>
      </div>

      {/* Secondary Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
            <h3 className="text-xs font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Asset Distribution
            </h3>
            <div className="space-y-4">
                {Object.entries(pnlByAsset).sort((a,b) => b[1] - a[1]).map(([asset, pnl]) => (
                    <div key={asset} className="flex items-center justify-between p-3 bg-white/5 light-theme:bg-black/5 rounded-xl border border-white/5 light-theme:border-black/5">
                        <span className="text-sm font-bold text-white light-theme:text-text-light">{asset}</span>
                        <span className={`text-sm font-mono font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} {currency}
                        </span>
                    </div>
                ))}
                {Object.keys(pnlByAsset).length === 0 && <div className="text-center py-10 text-stone-700 light-theme:text-stone-400 italic text-sm uppercase tracking-widest font-bold">No asset data available</div>}
            </div>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
            <h3 className="text-xs font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance Highlights
            </h3>
            <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 bg-white/5 light-theme:bg-black/5 rounded-2xl border border-white/5 light-theme:border-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><Award className="w-5 h-5" /></div>
                        <div>
                            <div className="text-[10px] text-stone-500 light-theme:text-stone-600 uppercase font-bold tracking-widest">Best Performing Asset</div>
                            <div className="text-white light-theme:text-text-light font-bold">{bestAsset}</div>
                        </div>
                    </div>
                    <div className="text-emerald-500 font-mono font-bold">{bestPnl !== -Infinity ? `+${bestPnl.toFixed(2)}` : '0.00'}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 light-theme:bg-black/5 rounded-2xl border border-white/5 light-theme:border-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary"><Activity className="w-5 h-5" /></div>
                        <div>
                            <div className="text-[10px] text-stone-500 light-theme:text-stone-600 uppercase font-bold tracking-widest">Capital ROI</div>
                            <div className="text-white light-theme:text-text-light font-bold">Account Growth</div>
                        </div>
                    </div>
                    <div className="text-primary font-mono font-bold">{capital > 0 ? ((totalPnl / capital) * 100).toFixed(1) : '0.0'}%</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 light-theme:bg-black/5 rounded-2xl border border-white/5 light-theme:border-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Target className="w-5 h-5" /></div>
                        <div>
                            <div className="text-[10px] text-stone-500 light-theme:text-stone-600 uppercase font-bold tracking-widest">Average Win</div>
                            <div className="text-white light-theme:text-text-light font-bold">Per Winning Trade</div>
                        </div>
                    </div>
                    <div className="text-emerald-500 font-mono font-bold">+{avgWin.toFixed(2)}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 light-theme:bg-black/5 rounded-2xl border border-white/5 light-theme:border-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><TrendingDown className="w-5 h-5" /></div>
                        <div>
                            <div className="text-[10px] text-stone-500 light-theme:text-stone-600 uppercase font-bold tracking-widest">Average Loss</div>
                            <div className="text-white light-theme:text-text-light font-bold">Per Losing Trade</div>
                        </div>
                    </div>
                    <div className="text-red-500 font-mono font-bold">-{avgLoss.toFixed(2)}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
