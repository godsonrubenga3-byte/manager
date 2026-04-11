import React from 'react';
import Markdown from 'react-markdown';
import { Sparkles, BrainCircuit, Loader2 } from 'lucide-react';

interface AIInsightsProps {
  insights: string;
  loading: boolean;
  onRefresh: () => void;
}

export default function AIInsights({ insights, loading, onRefresh }: AIInsightsProps) {
  return (
    <div className="glass p-6 rounded-2xl border-l-4 border-l-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <BrainCircuit className="w-32 h-32 text-white" />
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Financial Advisor
          <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Pending</span>
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh Insights'}
        </button>
      </div>

      <div className="prose prose-invert prose-stone max-w-none prose-headings:text-white prose-p:text-stone-400 prose-strong:text-white">
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse"></div>
          </div>
        ) : (
          <Markdown>{insights}</Markdown>
        )}
      </div>
    </div>
  );
}
