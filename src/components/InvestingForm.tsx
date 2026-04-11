import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, DollarSign, Info, PlusCircle, Tag, Layers, Database } from 'lucide-react';

interface InvestingFormProps {
  onAdd: (investment: any) => void;
  currency: string;
}

const ASSET_TYPES = ['Stocks', 'Crypto', 'Mutual Funds', 'Real Estate', 'Bonds', 'Other'];

export default function InvestingForm({ onAdd, currency }: InvestingFormProps) {
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState(ASSET_TYPES[0]);
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Dynamic calculation logic
  // When quantity or buyPrice changes, update totalCost
  useEffect(() => {
    if (quantity && buyPrice) {
      const calculated = (parseFloat(quantity) * parseFloat(buyPrice)).toFixed(2);
      setTotalCost(calculated);
    }
  }, [quantity, buyPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !quantity || !buyPrice) return;

    onAdd({
      asset_name: assetName,
      asset_type: assetType,
      quantity: parseFloat(quantity),
      buy_price: parseFloat(buyPrice),
      total_cost: parseFloat(totalCost) || (parseFloat(quantity) * parseFloat(buyPrice)),
      currency: currency, 
      date,
      platform,
      notes
    });

    // Reset form
    setAssetName('');
    setQuantity('');
    setBuyPrice('');
    setTotalCost('');
    setPlatform('');
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl border border-white/10 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold flex items-center gap-3 text-white">
          <Briefcase className="w-6 h-6 text-primary" />
          Log New Investment
        </h2>
        <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
          Portfolio Tracker
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-500 uppercase ml-1">Asset Name / Ticker</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="e.g. AAPL, BTC, S&P 500"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-white text-sm transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-500 uppercase ml-1">Asset Type</label>
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-white text-sm transition-all appearance-none"
            >
              {ASSET_TYPES.map(type => <option key={type} value={type} className="bg-card-dark">{type}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-500 uppercase ml-1">Quantity</label>
          <div className="relative">
            <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-white text-sm transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-500 uppercase ml-1">Buy Price ({currency})</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">{currency}</span>
            <input
              type="number"
              step="any"
              placeholder="Per Unit"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-white text-sm transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-500 uppercase ml-1">Total Cost ({currency})</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">{currency}</span>
            <input
              type="number"
              step="any"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-emerald-400 text-sm transition-all font-mono"
              placeholder="Auto-calculated"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-500 uppercase ml-1">Purchase Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-white text-sm transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-stone-500 uppercase ml-1">Platform / Broker</label>
        <input
          type="text"
          placeholder="e.g. Binance, Robinhood, IBKR"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-white text-sm transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-stone-500 uppercase ml-1">Notes (Optional)</label>
        <textarea
          placeholder="Strategy, goals, or reminders..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-white text-sm transition-all min-h-[80px] resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-primary hover:bg-secondary text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 text-lg active:scale-95"
      >
        <PlusCircle className="w-5 h-5" />
        Add to Portfolio
      </button>
    </form>
  );
}
