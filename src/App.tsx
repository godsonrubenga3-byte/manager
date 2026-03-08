import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, PieChart, LayoutDashboard, Settings, LogOut, Menu, X, Search, Filter, TrendingUp, Target, Trash2 } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Spending3D from './components/Spending3D';
import InvestmentCards from './components/InvestmentCards';
import AIInsights from './components/AIInsights';
import BudgetManager from './components/BudgetManager';
import SavingsGoals from './components/SavingsGoals';
import { getAIInsights, Transaction } from './services/geminiService';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currency, setCurrency] = useState<'INR' | 'TZS'>(() => {
    return (localStorage.getItem('manager_currency') as 'INR' | 'TZS') || 'INR';
  });

  useEffect(() => {
    localStorage.setItem('manager_currency', currency);
  }, [currency]);

  useEffect(() => {
    fetchTransactions();
    fetchInvestments();
    fetchBudgets();
    fetchGoals();
  }, []);

  const fetchTransactions = async () => {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    setTransactions(data);
  };

  const fetchInvestments = async () => {
    const res = await fetch('/api/investments');
    const data = await res.json();
    setInvestments(data);
  };

  const fetchBudgets = async () => {
    const res = await fetch('/api/budgets');
    const data = await res.json();
    setBudgets(data);
  };

  const fetchGoals = async () => {
    const res = await fetch('/api/goals');
    const data = await res.json();
    setGoals(data);
  };

  const handleAddTransaction = async (newTransaction: any) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTransaction),
    });
    if (res.ok) {
      fetchTransactions();
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchTransactions();
    }
  };

  const handleSaveBudget = async (category: string, limit_amount: number) => {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, limit_amount }),
    });
    if (res.ok) {
      fetchBudgets();
    }
  };

  const handleAddGoal = async (name: string, target_amount: number, current_amount: number, deadline?: string) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, target_amount, current_amount, deadline }),
    });
    if (res.ok) {
      fetchGoals();
    }
  };

  const handleUpdateGoal = async (id: number, current_amount: number) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_amount }),
    });
    if (res.ok) {
      fetchGoals();
    }
  };

  const handleDeleteGoal = async (id: number) => {
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchGoals();
    }
  };

  const handleRefreshInsights = async () => {
    setLoadingInsights(true);
    const result = await getAIInsights(transactions, currency);
    setInsights(result || '');
    setLoadingInsights(false);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      const res = await fetch('/api/settings/clear-data', { method: 'POST' });
      if (res.ok) {
        fetchTransactions();
        fetchBudgets();
        fetchGoals();
        alert('All data has been cleared.');
      }
    }
  };

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income') acc.income += curr.amount;
        else acc.expenses += curr.amount;
        return acc;
      },
      { income: 0, expenses: 0 }
    );
  }, [transactions]);

  const balance = totals.income - totals.expenses;

  const spendingByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    return categories;
  }, [transactions]);

  const chartData = useMemo(() => {
    return Object.entries(spendingByCategory).map(([category, amount]) => ({ category, amount }));
  }, [spendingByCategory]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) =>
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const topCategory = useMemo(() => {
    if (chartData.length === 0) return { category: 'N/A', amount: 0 };
    return chartData.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
  }, [chartData]);

  return (
    <div className="min-h-screen bg-bg-dark flex text-stone-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card-dark border-r border-border-dark transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <Wallet className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Manager</h1>
          </div>

          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
            <NavItem icon={<PieChart className="w-5 h-5" />} label="Analytics" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
            <NavItem icon={<TrendingUp className="w-5 h-5" />} label="Investments" active={activeTab === 'Investments'} onClick={() => setActiveTab('Investments')} />
            <NavItem icon={<Target className="w-5 h-5" />} label="Budgets & Goals" active={activeTab === 'Budgets'} onClick={() => setActiveTab('Budgets')} />
            <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-stone-100">
          <button className="flex items-center gap-3 text-stone-500 hover:text-red-600 transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Habari, User!</h2>
            <p className="text-stone-400">Here's what's happening with your money today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <Search className="w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-stone-600"
              />
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 bg-card-dark rounded-lg border border-border-dark">
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Balance"
            amount={balance}
            icon={<Wallet className="w-6 h-6 text-primary" />}
            color="primary"
            currency={currency}
          />
          <StatCard
            title="Total Income"
            amount={totals.income}
            icon={<ArrowUpCircle className="w-6 h-6 text-emerald-500" />}
            color="emerald"
            currency={currency}
          />
          <StatCard
            title="Total Expenses"
            amount={totals.expenses}
            icon={<ArrowDownCircle className="w-6 h-6 text-red-500" />}
            color="red"
            currency={currency}
          />
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-stone-400 font-medium">Top Spending</span>
              <div className="p-2 bg-white/5 rounded-lg">
                <PieChart className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="text-xl font-bold text-white truncate">
              {topCategory.category}
            </div>
            <div className="text-xs text-stone-500 mt-1">
              {currency === 'INR' ? '₹' : ''}{topCategory.amount.toLocaleString()} {currency === 'TZS' ? 'TZS' : ''}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form and List */}
          <div className="lg:col-span-1 space-y-8">
            <TransactionForm onAdd={handleAddTransaction} currency={currency} />
            <TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} currency={currency} />
          </div>

          {/* Right Column: Analytics and AI */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'Dashboard' && (
              <>
                <section className="space-y-4">
                  <h2 className="text-xl font-bold px-2">Spending Visualization</h2>
                  <Spending3D data={chartData.length > 0 ? chartData : [{ category: 'No Data', amount: 1 }]} />
                </section>

                <AIInsights
                  insights={insights}
                  loading={loadingInsights}
                  onRefresh={handleRefreshInsights}
                />
              </>
            )}

            {activeTab === 'Analytics' && (
              <div className="space-y-8">
                <section className="space-y-4">
                  <h2 className="text-xl font-bold px-2">Spending by Category</h2>
                  <Spending3D data={chartData.length > 0 ? chartData : [{ category: 'No Data', amount: 1 }]} />
                </section>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4">Monthly Overview</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Total Income</span>
                        <span className="text-emerald-500 font-bold">
                          {currency === 'INR' ? '₹' : ''}{totals.income.toLocaleString()} {currency === 'TZS' ? 'TZS' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Total Expenses</span>
                        <span className="text-red-500 font-bold">
                          {currency === 'INR' ? '₹' : ''}{totals.expenses.toLocaleString()} {currency === 'TZS' ? 'TZS' : ''}
                        </span>
                      </div>
                      <div className="h-px bg-white/5 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Net Savings</span>
                        <span className="text-primary font-bold">
                          {currency === 'INR' ? '₹' : ''}{(totals.income - totals.expenses).toLocaleString()} {currency === 'TZS' ? 'TZS' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4">Efficiency</h3>
                    <div className="flex flex-col items-center justify-center h-full pb-6">
                      <div className="text-4xl font-bold text-white mb-2">
                        {totals.income > 0 ? Math.round(((totals.income - totals.expenses) / totals.income) * 100) : 0}%
                      </div>
                      <div className="text-stone-500 text-sm uppercase tracking-widest font-bold">Savings Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Investments' && (
              <InvestmentCards investments={investments} currency={currency} />
            )}

            {activeTab === 'Budgets' && (
              <div className="space-y-8">
                <BudgetManager
                  budgets={budgets}
                  spendingByCategory={spendingByCategory}
                  onSave={handleSaveBudget}
                  currency={currency}
                />
                <SavingsGoals
                  goals={goals}
                  onAdd={handleAddGoal}
                  onUpdate={handleUpdateGoal}
                  onDelete={handleDeleteGoal}
                  currency={currency}
                />
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="space-y-8">
                <div className="glass p-8 rounded-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                      <Settings className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Settings</h2>
                      <p className="text-stone-400">Manage your preferences and data.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Data Management</h3>
                      <div className="space-y-3">
                        <button 
                          onClick={handleClearData}
                          className="w-full flex items-center justify-between px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition-all"
                        >
                          <span className="font-semibold">Clear All Data</span>
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => alert('Exporting data...')}
                          className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-stone-300 hover:bg-white/10 transition-all"
                        >
                          <span className="font-semibold">Export Data (JSON)</span>
                          <ArrowUpCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Preferences</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-stone-300">
                          <span className="font-semibold">Currency</span>
                          <div className="flex bg-white/5 p-1 rounded-lg">
                            <button
                              onClick={() => setCurrency('INR')}
                              className={`px-3 py-1 rounded-md text-xs transition-all ${currency === 'INR' ? 'bg-primary shadow-sm text-white' : 'text-stone-500'}`}
                            >
                              INR (₹)
                            </button>
                            <button
                              onClick={() => setCurrency('TZS')}
                              className={`px-3 py-1 rounded-md text-xs transition-all ${currency === 'TZS' ? 'bg-primary shadow-sm text-white' : 'text-stone-500'}`}
                            >
                              TZS
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-stone-300">
                          <span className="font-semibold">Language</span>
                          <span className="text-primary font-bold">English</span>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full text-left ${active ? 'bg-primary text-white shadow-md shadow-primary/40' : 'text-stone-400 hover:bg-white/5'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, amount, icon, color, currency }: { title: string; amount: number; icon: React.ReactNode; color: string; currency: 'INR' | 'TZS' }) {
  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-stone-400 font-medium">{title}</span>
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
      </div>
      <div className="text-2xl font-bold font-mono text-white">
        {currency === 'INR' ? '₹' : ''}{amount.toLocaleString()} <span className="text-sm font-normal text-stone-500">{currency === 'TZS' ? 'TZS' : '₹'}</span>
      </div>
    </div>
  );
}

