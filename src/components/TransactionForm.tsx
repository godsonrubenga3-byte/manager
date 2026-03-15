import React, { useState, useRef } from 'react';
import { PlusCircle, Tag, FileText, Camera, X, Image as ImageIcon, Scan } from 'lucide-react';
import ReceiptScanner from './ReceiptScanner';

interface TransactionFormProps {
  onAdd: (transaction: any) => void;
  currency: string;
}

export default function TransactionForm({ onAdd, currency }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Business', 'Salary', 'Other'
  ];

  const handleScanComplete = (data: any) => {
    if (data.amount) setAmount(data.amount.toString());
    if (data.category && categories.includes(data.category)) {
      setCategory(data.category);
    } else if (data.category) {
      setCategory('Other');
    }
    if (data.description) setDescription(data.description);
    setShowScanner(false);
  };

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
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          <PlusCircle className="w-5 h-5 text-primary" />
          Add Transaction
        </h2>
      </div>

      {/* 1. Scanning Receipt at the top */}
      <button
        type="button"
        onClick={() => setShowScanner(true)}
        className="w-full py-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-wider shadow-sm"
      >
        <Scan className="w-5 h-5" />
        Scan Receipt with AI
      </button>

      {showScanner && (
        <ReceiptScanner 
          onScan={handleScanComplete} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <div className="space-y-4 pt-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm font-bold">{currency}</span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-14 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-medium text-white placeholder:text-stone-600"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none text-white text-sm"
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
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left text-stone-400 flex items-center gap-2 overflow-hidden text-sm"
            >
              <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              {image ? (
                <span className="text-emerald-500 flex items-center gap-1 truncate">
                  <ImageIcon className="w-3 h-3" /> Added
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
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-white placeholder:text-stone-600 min-h-[60px] resize-none text-sm"
          />
        </div>

        {/* 2. Expenses/Income slider at the bottom */}
        <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-primary shadow-lg text-white' : 'text-stone-500 hover:text-stone-300'}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-primary shadow-lg text-white' : 'text-stone-500 hover:text-stone-300'}`}
          >
            Income
          </button>
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
