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
  currency: 'INR' | 'TZS';
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
      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-6">
          <Target className="w-6 h-6 text-primary" />
          Savings Goals
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <input
            type="text"
            placeholder="Goal Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-stone-600"
          />
          <input
            type="number"
            placeholder={`Target (${currency === 'INR' ? '₹' : 'TZS'})`}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-stone-600"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </form>

        <div className="space-y-6">
          {goals.length === 0 ? (
            <div className="text-center py-4 text-stone-600 italic">No savings goals yet.</div>
          ) : (
            goals.map((goal) => {
              const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              const isComplete = goal.current_amount >= goal.target_amount;

              return (
                <div key={goal.id} className="space-y-3 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-stone-100 flex items-center gap-2">
                        {goal.name}
                        {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {currency === 'INR' ? '₹' : ''}{goal.current_amount.toLocaleString()} / {currency === 'INR' ? '₹' : ''}{goal.target_amount.toLocaleString()} {currency === 'TZS' ? 'TZS' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Update"
                        className="w-24 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-primary/20"
                        onBlur={(e) => {
                          if (e.target.value) {
                            onUpdate(goal.id, parseFloat(e.target.value));
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={() => onDelete(goal.id)}
                        className="p-1 text-stone-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-stone-500 uppercase font-bold tracking-widest text-right">
                    {Math.round(percent)}% Complete
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
