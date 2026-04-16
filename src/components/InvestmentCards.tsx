import React from 'react';
import { TrendingUp, ShieldCheck, Wallet, ExternalLink, ArrowUpRight } from 'lucide-react';

interface Investment {
  name: string;
  expectedReturn: string;
  risk: string;
  minAmount: string;
  description: string;
}

interface InvestmentCardsProps {
  investments: Investment[];
  currency: string;
}

export default function InvestmentCards({ investments, currency }: InvestmentCardsProps) {
  // Generic fallback if API returns nothing
  const genericInvestments = [
    {
      name: "Index Funds (S&P 500)",
      expectedReturn: "8-10% p.a.",
      risk: "Moderate",
      minAmount: "Varies",
      description: "A low-cost way to track the performance of the overall stock market for long-term growth."
    },
    {
      name: "High-Yield Savings",
      expectedReturn: "4-5% p.a.",
      risk: "Very Low",
      minAmount: "None",
      description: "A safe place to park your emergency fund while earning competitive interest rates."
    },
    {
        name: "Dividend Blue Chips",
        expectedReturn: "5-7% p.a.",
        risk: "Low-Moderate",
        minAmount: "1 Share",
        description: "Established companies that pay out a portion of their earnings to shareholders regularly."
    },
    {
        name: "Government Bonds",
        expectedReturn: "3-5% p.a.",
        risk: "Very Low",
        minAmount: "Varies",
        description: "Lend money to the government for a fixed period in exchange for regular interest payments."
    }
  ];

  const displayInvestments = investments.length > 0 ? investments : genericInvestments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-3 text-white">
          <TrendingUp className="w-6 h-6 text-primary" />
          Investment Opportunities
        </h2>
        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-stone-500 uppercase tracking-widest">
            Market Insights
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayInvestments.map((inv, idx) => (
          <div key={idx} className="glass p-6 rounded-3xl hover:border-primary/50 transition-all group relative overflow-hidden bg-white/[0.02] border border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-primary" />
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors leading-tight max-w-[70%]">{inv.name}</h3>
              <span className={`px-2.5 py-1 rounded-xl text-xs uppercase font-bold tracking-widest border ${
                inv.risk === 'Low' || inv.risk === 'Very Low' 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {inv.risk} Risk
              </span>
            </div>
            
            <p className="text-xs text-stone-400 mb-6 line-clamp-3 leading-relaxed font-medium">
                {inv.description}
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5 bg-white/[0.01] -mx-6 px-6 -mb-6 pb-6">
              <div>
                <div className="text-xs text-stone-600 uppercase font-bold tracking-widest mb-1.5">Est. Return</div>
                <div className="text-emerald-500 font-mono font-bold text-sm">{inv.expectedReturn}</div>
              </div>
              <div>
                <div className="text-xs text-stone-600 uppercase font-bold tracking-widest mb-1.5">Min. Amount</div>
                <div className="text-white font-mono font-bold text-sm">
                  {inv.minAmount.includes('₹') || inv.minAmount.includes('TZS') || inv.minAmount.includes('$') || inv.minAmount.includes('€') || inv.minAmount.includes('£')
                    ? inv.minAmount 
                    : `${currency}${inv.minAmount}`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
