import React, { useState } from 'react';
import { Target, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
}

interface SavingsGoalsProps {
  goals: Goal[];
  onAdd: (name: string, target: number, current: number, deadline?: string) => void;
  onUpdate: (id: number, current: number) => void;
  onDelete: (id: number) => void;
  currency: string;
}

export default function SavingsGoals({ goals, onAdd, onUpdate, onDelete, currency }: SavingsGoalsProps) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;
    onAdd(name, parseFloat(target), parseFloat(current || '0'));
    setName('');
    setTarget('');
    setCurrent('');
  };

  return (
    <div className="space-y-6">
      <div className="glass p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                <Target className="w-6 h-6 text-primary" />
                Savings Goals
            </h2>
            <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                AI Powered Tracking
            </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-10">
          <input
            type="text"
            placeholder="Goal Name (e.g., New Laptop)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-stone-600 transition-all"
          />
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">{currency}</span>
            <input
              type="number"
              placeholder="Target Amount"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-stone-600 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </form>

        <div className="space-y-8">
          {goals.length === 0 ? (
            <div className="text-center py-10 text-stone-600 italic border-2 border-dashed border-white/5 rounded-2xl">No savings goals yet. Start small!</div>
          ) : (
            goals.map((goal) => {
              const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              const isComplete = goal.current_amount >= goal.target_amount;

              return (
                <div key={goal.id} className="space-y-4 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-white flex items-center gap-2 mb-1">
                        {goal.name}
                        {isComplete && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </h3>
                      <p className="text-xs font-mono text-stone-500 font-bold">
                        {currency}{goal.current_amount.toLocaleString()} <span className="text-stone-600">/</span> {currency}{goal.target_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative group/input">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-primary font-bold opacity-0 group-focus-within/input:opacity-100 transition-opacity">{currency}</span>
                        <input
                            type="number"
                            placeholder="Add to savings..."
                            className="w-32 pl-3 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-primary/20 focus:pl-6 focus:border-primary transition-all placeholder:text-[10px]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val) {
                                        onUpdate(goal.id, goal.current_amount + parseFloat(val));
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }
                            }}
                        />
                      </div>
                      <button
                        onClick={() => onDelete(goal.id)}
                        className="p-2 text-stone-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 lg:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                        <div
                          className={`h-full transition-all duration-1000 rounded-full shadow-lg ${isComplete ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-primary shadow-primary/20'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">{isComplete ? 'Goal Met!' : 'In Progress'}</span>
                          <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                            {Math.round(percent)}% Complete
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
