import React, { useState } from 'react';
import { Target, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Budget {
  category: string;
  limit_amount: number;
}

interface BudgetManagerProps {
  budgets: Budget[];
  spendingByCategory: Record<string, number>;
  onSave: (category: string, limit: number) => void;
  currency: string;
}

export default function BudgetManager({ budgets, spendingByCategory, onSave, currency }: BudgetManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [limit, setLimit] = useState('');

  const categories = [
    'Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Business', 'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit) return;
    onSave(selectedCategory, parseFloat(limit));
    setLimit('');
  };

  return (
    <div className="space-y-6">
      <div className="glass p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                <Target className="w-6 h-6 text-primary" />
                Budget Planner
            </h2>
            <div className="px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 text-xs font-bold text-amber-500 uppercase tracking-widest">
                Smart Limits
            </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 mb-10">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none transition-all cursor-pointer"
          >
            {categories.map(c => <option key={c} value={c} className="bg-card-dark">{c}</option>)}
          </select>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">{currency}</span>
            <input
              type="number"
              placeholder="Monthly Limit"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-stone-600 text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Target className="w-4 h-4" />
            Set Budget
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-stone-600 italic border-2 border-dashed border-white/5 rounded-2xl">No budgets set yet. Plan your spending!</div>
          ) : (
            budgets.map((budget) => {
              const spent = spendingByCategory[budget.category] || 0;
              const percent = Math.min((spent / budget.limit_amount) * 100, 100);
              const isOver = spent > budget.limit_amount;

              return (
                <div key={budget.category} className="space-y-3 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">{budget.category}</h4>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                        <span className={isOver ? 'text-red-500' : 'text-emerald-500'}>
                          {currency}{spent.toLocaleString()}
                        </span>
                        <span className="text-stone-700">/</span>
                        <span className="text-stone-400">
                          {currency}{budget.limit_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {isOver ? (
                        <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full transition-all duration-1000 rounded-full ${isOver ? 'bg-red-500 shadow-sm shadow-red-500/20' : 'bg-primary shadow-sm shadow-primary/20'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                        <span className={isOver ? 'text-red-500/80' : 'text-stone-600'}>
                          {isOver ? 'Limit Exceeded' : 'Under Control'}
                        </span>
                        <span className={isOver ? 'text-red-500' : 'text-primary'}>
                          {Math.round(percent)}%
                        </span>
                      </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
