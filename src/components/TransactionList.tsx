import React, { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, ArrowUpRight, ArrowDownLeft, Receipt, X } from 'lucide-react';
import { Transaction } from '../services/geminiService';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
}

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold px-2 text-white">Recent Activity</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-stone-600 italic">No transactions yet.</div>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="glass p-4 rounded-xl flex items-center justify-between group hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-semibold text-stone-200 flex items-center gap-2">
                    {t.category}
                    {t.image && (
                      <button
                        onClick={() => setSelectedImage(t.image)}
                        className="p-1 hover:bg-white/10 rounded-md text-stone-500 hover:text-primary transition-colors"
                        title="View Receipt"
                      >
                        <Receipt className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-stone-500 flex items-center gap-2">
                    {format(new Date(t.date), 'MMM dd, yyyy')}
                    {t.description && <span className="before:content-['•'] before:mr-2 truncate max-w-[150px]">{t.description}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`font-mono font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-stone-300'}`}>
                  {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                </div>
                <button
                  onClick={() => t.id && onDelete(t.id)}
                  className="p-2 text-stone-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full bg-card-dark rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2">
              <img
                src={selectedImage}
                alt="Receipt"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 text-center text-stone-400 text-sm border-t border-white/5">
              Payment Proof / Receipt
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
