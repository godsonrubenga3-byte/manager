import React, { useState } from 'react';
import { PlusCircle, Tag, FileText } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

interface TransactionFormProps {
  onAdd: (transaction: any) => void;
  currency: string;
}

export default function TransactionForm({ onAdd, currency }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');

  const expenseCategories = [
    'Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'
  ];
  
  const incomeCategories = [
    'Business', 'Salary', 'Profits', 'Investments', 'Gifts', 'Other'
  ];

  const categoryOptions = (type === 'expense' ? expenseCategories : incomeCategories).map(c => ({ value: c, label: c }));

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    // Set default category for the new type to avoid invalid state
    setCategory(newType === 'expense' ? 'Food' : 'Business');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    onAdd({
      amount: parseFloat(amount),
      category,
      description,
      date: new Date().toISOString(),
      type
    });

    setAmount('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white light-theme:text-text-light">
          <PlusCircle className="w-5 h-5 text-primary" />
          Add Transaction
        </h2>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex bg-white/5 light-theme:bg-black/5 p-1.5 rounded-xl border border-white/5 light-theme:border-black/5">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-primary shadow-lg text-white' : 'text-stone-500 hover:text-stone-300 light-theme:hover:text-stone-700'}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-primary shadow-lg text-white' : 'text-stone-500 hover:text-stone-300 light-theme:hover:text-stone-700'}`}
          >
            Income
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm font-bold">{currency}</span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-14 pr-4 py-3 glass-input rounded-xl text-lg font-medium text-white light-theme:text-text-light placeholder:text-stone-600"
            required
          />
        </div>

        <CustomDropdown 
            options={categoryOptions} 
            value={category} 
            onChange={setCategory}
            icon={<Tag className="w-4 h-4 text-stone-500" />}
        />

        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
          <textarea
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full pl-10 pr-4 py-2 glass-input rounded-xl text-white light-theme:text-text-light placeholder:text-stone-600 min-h-[60px] resize-none text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-primary hover:bg-secondary text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 text-lg active:scale-95"
        >
          Save Transaction
        </button>
      </div>
    </form>
  );
}
