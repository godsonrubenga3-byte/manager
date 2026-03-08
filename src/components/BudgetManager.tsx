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
  currency: 'INR' | 'TZS';
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
      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-6">
          <Target className="w-6 h-6 text-primary" />
          Budget Planner
        </h2>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/20"
          >
            {categories.map(c => <option key={c} value={c} className="bg-card-dark">{c}</option>)}
          </select>
          <input
            type="number"
            placeholder={`Limit (${currency === 'INR' ? '₹' : 'TZS'})`}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-stone-600"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-all"
          >
            Set
          </button>
        </form>

        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center py-4 text-stone-600 italic">No budgets set yet.</div>
          ) : (
            budgets.map((budget) => {
              const spent = spendingByCategory[budget.category] || 0;
              const percent = Math.min((spent / budget.limit_amount) * 100, 100);
              const isOver = spent > budget.limit_amount;

              return (
                <div key={budget.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-300 font-medium">{budget.category}</span>
                    <span className="text-stone-500">
                      <span className={isOver ? 'text-red-500 font-bold' : 'text-stone-300'}>
                        {currency === 'INR' ? '₹' : ''}{spent.toLocaleString()} {currency === 'TZS' ? 'TZS' : ''}
                      </span>
                      {' / '}{currency === 'INR' ? '₹' : ''}{budget.limit_amount.toLocaleString()} {currency === 'TZS' ? 'TZS' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  {isOver && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                      <AlertCircle className="w-3 h-3" />
                      Over Budget!
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
