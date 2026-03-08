import React from 'react';
import { Sparkles, TrendingUp, ShieldCheck, Wallet } from 'lucide-react';

interface Investment {
  name: string;
  expectedReturn: string;
  risk: string;
  minAmount: string;
  description: string;
}

interface InvestmentCardsProps {
  investments: Investment[];
  currency: 'INR' | 'TZS';
}

export default function InvestmentCards({ investments, currency }: InvestmentCardsProps) {
  // Indian specific investment opportunities if the API returns the old ones
  const indianInvestments = [
    {
      name: "Public Provident Fund (PPF)",
      expectedReturn: "7.1% p.a.",
      risk: "Very Low",
      minAmount: "₹500",
      description: "Government-backed long-term savings scheme with tax benefits under Section 80C."
    },
    {
      name: "Mutual Funds (SIP)",
      expectedReturn: "12-15% p.a.",
      risk: "Moderate",
      minAmount: "₹500",
      description: "Systematic Investment Plan in equity or debt funds for wealth creation."
    },
    {
      name: "Fixed Deposits (FD)",
      expectedReturn: "6-7.5% p.a.",
      risk: "Low",
      minAmount: "₹1,000",
      description: "Safe investment with guaranteed returns over a fixed tenure."
    },
    {
      name: "National Savings Certificate",
      expectedReturn: "7.7% p.a.",
      risk: "Very Low",
      minAmount: "₹1,000",
      description: "Fixed income post office savings scheme with tax benefits."
    }
  ];

  // Tanzania specific investment opportunities
  const tanzaniaInvestments = [
    {
      name: "UTT AMIS (Liquid Fund)",
      expectedReturn: "12-14% p.a.",
      risk: "Low",
      minAmount: "5,000 TZS",
      description: "High liquidity fund managed by UTT AMIS, ideal for emergency funds."
    },
    {
      name: "Treasury Bonds (20-25 Years)",
      expectedReturn: "15.4% p.a.",
      risk: "Very Low",
      minAmount: "1,000,000 TZS",
      description: "Government-backed long-term bonds with guaranteed semi-annual interest payments."
    },
    {
      name: "DSE (Stock Market)",
      expectedReturn: "Varies",
      risk: "Moderate",
      minAmount: "Varies",
      description: "Invest in top Tanzanian companies like CRDB, NMB, or TBL for dividends and growth."
    }
  ];

  const displayInvestments = investments.length > 0 
    ? investments 
    : (currency === 'INR' ? indianInvestments : tanzaniaInvestments);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <TrendingUp className="w-6 h-6 text-primary" />
          Investment Opportunities ({currency === 'INR' ? 'India' : 'Tanzania'})
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayInvestments.map((inv, idx) => (
          <div key={idx} className="glass p-5 rounded-2xl hover:border-primary/50 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-stone-100 group-hover:text-primary transition-colors">{inv.name}</h3>
              <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                inv.risk === 'Low' || inv.risk === 'Very Low' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {inv.risk} Risk
              </span>
            </div>
            
            <p className="text-sm text-stone-400 mb-4 line-clamp-2">{inv.description}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <div className="text-[10px] text-stone-500 uppercase font-bold">Est. Return</div>
                <div className="text-emerald-500 font-bold">{inv.expectedReturn}</div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 uppercase font-bold">Min. Amount</div>
                <div className="text-stone-200 font-bold">
                  {inv.minAmount.includes('₹') || inv.minAmount.includes('TZS') 
                    ? inv.minAmount 
                    : (currency === 'INR' ? `₹${inv.minAmount}` : `${inv.minAmount} TZS`)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
