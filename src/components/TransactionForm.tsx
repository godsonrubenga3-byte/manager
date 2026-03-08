import React, { useState, useRef } from 'react';
import { PlusCircle, Tag, FileText, Camera, X, Image as ImageIcon } from 'lucide-react';

interface TransactionFormProps {
  onAdd: (transaction: any) => void;
}

export default function TransactionForm({ onAdd }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Business', 'Salary', 'Other'
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    onAdd({
      amount: parseFloat(amount),
      category,
      description,
      image,
      date: new Date().toISOString(),
      type
    });

    setAmount('');
    setDescription('');
    setImage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          <PlusCircle className="w-5 h-5 text-primary" />
          Add Transaction
        </h2>
        <div className="flex bg-white/5 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`px-3 py-1 rounded-md text-sm transition-all ${type === 'expense' ? 'bg-primary shadow-sm text-white' : 'text-stone-500'}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`px-3 py-1 rounded-md text-sm transition-all ${type === 'income' ? 'bg-primary shadow-sm text-white' : 'text-stone-500'}`}
          >
            Income
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">₹</span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-medium text-white placeholder:text-stone-600"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none text-white"
            >
              {categories.map(c => <option key={c} value={c} className="bg-card-dark">{c}</option>)}
            </select>
          </div>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left text-stone-400 flex items-center gap-2 overflow-hidden"
            >
              <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              {image ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Receipt Added
                </span>
              ) : (
                "Add Receipt"
              )}
            </button>
            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-3 h-3 text-stone-500" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
          <textarea
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-white placeholder:text-stone-600 min-h-[60px] resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          Save Transaction
        </button>
      </div>
    </form>
  );
}
