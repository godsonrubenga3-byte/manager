import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowUpCircle, ArrowDownCircle, PieChart, LayoutDashboard, Settings, LogOut, Menu, X, Search, Filter, TrendingUp, Target, Trash2, ChevronDown, Globe, Cloud, CheckCircle, Clock, RefreshCcw, Key, Download, FileText } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import PieChart2D from '../components/PieChart2D';
import Spending3D from '../components/Spending3D';
import InvestmentCards from '../components/InvestmentCards';
import AIInsights from '../components/AIInsights';
import BudgetManager from '../components/BudgetManager';
import SavingsGoals from '../components/SavingsGoals';
import Notification, { NotificationType } from '../components/Notification';
import { getAIInsights, Transaction as GeminiTransaction } from '../services/geminiService';
import { Preferences } from '@capacitor/preferences';
import { convertCurrency, fetchLiveRates, STATIC_EXCHANGE_RATES } from '../utils/currency';

// Extend Transaction to include currency from DB
interface Transaction extends GeminiTransaction {
    currency: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

export default function Dashboard() {
  const auth = useAuth();
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState([]);
  const [rawBudgets, setRawBudgets] = useState<any[]>([]);
  const [rawGoals, setRawGoals] = useState<any[]>([]);
  const [insights, setInsights] = useState('');
  const [liveRates, setLiveRates] = useState<Record<string, number>>(STATIC_EXCHANGE_RATES);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

  const showNotification = (message: string, type: NotificationType = 'success') => {
    setNotification({ message, type });
  };

  // Cache helpers using Capacitor Preferences
  const getCacheKey = (key: string) => `manager_${key}`;
  
  const getCachedData = async <T,>(key: string): Promise<T | null> => {
    const { value } = await Preferences.get({ key: getCacheKey(key) });
    return value ? JSON.parse(value) : null;
  };

  const setCachedData = async <T,>(key: string, data: T) => {
    await Preferences.set({
      key: getCacheKey(key),
      value: JSON.stringify(data)
    });
  };

  const clearCache = async () => {
    await Preferences.remove({ key: getCacheKey('transactions') });
    await Preferences.remove({ key: getCacheKey('budgets') });
    await Preferences.remove({ key: getCacheKey('goals') });
    await Preferences.remove({ key: getCacheKey('investments') });
    await Preferences.remove({ key: 'last_synced' });
  };

  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [newUsername, setNewUsername] = useState(auth.user?.username || '');

  useEffect(() => {
    if (auth.user?.username) {
      setNewUsername(auth.user.username);
    }
  }, [auth.user?.username]);

  const currentCurrency = useMemo(() => 
    CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0], 
  [currencyCode]);

  // Convert data for display based on active currency and LIVE rates
  const transactions = useMemo(() => {
    let filtered = rawTransactions;
    
    if (dateFilter !== 'All Time') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      filtered = rawTransactions.filter(t => {
        const tDate = new Date(t.date);
        if (dateFilter === 'This Month') {
          return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        }
        if (dateFilter === 'Last Month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear;
        }
        return true;
      });
    }

    return filtered.map(t => ({
        ...t,
        amount: convertCurrency(t.amount, t.currency || 'USD', currencyCode, liveRates)
    }));
  }, [rawTransactions, currencyCode, liveRates, dateFilter]);

  const budgets = useMemo(() => {
    return rawBudgets.map(b => ({
        ...b,
        limit_amount: convertCurrency(b.limit_amount, b.currency || 'USD', currencyCode, liveRates)
    }));
  }, [rawBudgets, currencyCode, liveRates]);

  const goals = useMemo(() => {
    return rawGoals.map(g => ({
        ...g,
        target_amount: convertCurrency(g.target_amount, g.currency || 'USD', currencyCode, liveRates),
        current_amount: convertCurrency(g.current_amount, g.currency || 'USD', currencyCode, liveRates)
    }));
  }, [rawGoals, currencyCode, liveRates]);

  useEffect(() => {
    const initRates = async () => {
      const rates = await fetchLiveRates();
      setLiveRates(rates);
    };
    initRates();
  }, []);

  useEffect(() => {
    const loadMetadata = async () => {
      const { value: curr } = await Preferences.get({ key: 'manager_currency' });
      if (curr) setCurrencyCode(curr);
      
      const { value: sync } = await Preferences.get({ key: 'last_synced' });
      if (sync) setLastSynced(sync);
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    const saveCurrency = async () => {
      await Preferences.set({ key: 'manager_currency', value: currencyCode });
    };
    saveCurrency();
  }, [currencyCode]);

  useEffect(() => {
    handleSync(true); // Silent sync on load
    fetchInvestments();
  }, []);

  const handleSync = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      await Promise.all([
        fetchTransactions(),
        fetchBudgets(),
        fetchGoals()
      ]);
      const now = new Date().toLocaleString();
      setLastSynced(now);
      await Preferences.set({ key: 'last_synced', value: now });
      if (!silent) showNotification('Cloud Data Synchronized Successfully!');
    } catch (err) {
      console.error("Sync failed:", err);
      if (!silent) showNotification('Failed to sync with cloud. Check connection.', 'error');
    } finally {
      if (!silent) setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const fetchTransactions = async () => {
    const cached = await getCachedData<Transaction[]>('transactions');
    if (cached) setRawTransactions(cached);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions`);
      if (res.ok) {
        const data = await res.json();
        setRawTransactions(data);
        await setCachedData('transactions', data);
      }
    } catch (err) {
      console.error("Fetch transactions failed:", err);
    }
  };

  const fetchInvestments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/investments`);
      if (res.ok) {
        const data = await res.json();
        setInvestments(data);
      }
    } catch (err) {
      console.error("Fetch investments failed:", err);
    }
  };

  const fetchBudgets = async () => {
    const cached = await getCachedData<any[]>('budgets');
    if (cached) setRawBudgets(cached);
    try {
      const res = await fetch(`${API_BASE_URL}/api/budgets`);
      if (res.ok) {
        const data = await res.json();
        setRawBudgets(data);
        await setCachedData('budgets', data);
      }
    } catch (err) {
      console.error("Fetch budgets failed:", err);
    }
  };

  const fetchGoals = async () => {
    const cached = await getCachedData<any[]>('goals');
    if (cached) setRawGoals(cached);
    try {
      const res = await fetch(`${API_BASE_URL}/api/goals`);
      if (res.ok) {
        const data = await res.json();
        setRawGoals(data);
        await setCachedData('goals', data);
      }
    } catch (err) {
      console.error("Fetch goals failed:", err);
    }
  };

  const handleAddTransaction = async (newTransaction: any) => {
    const res = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTransaction, currency: currencyCode }),
    });
    if (res.ok) {
      if (newTransaction.image) {
        showNotification('Receipt & Transaction Uploaded Successfully!');
      } else {
        showNotification('Transaction Saved Successfully!');
      }
      fetchTransactions();
    } else {
      showNotification('Failed to save transaction.', 'error');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showNotification('Transaction Deleted.');
      fetchTransactions();
    }
  };

  const handleSaveBudget = async (category: string, limit_amount: number) => {
    const res = await fetch(`${API_BASE_URL}/api/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, limit_amount, currency: currencyCode }),
    });
    if (res.ok) {
      showNotification(`${category} Budget Updated!`);
      fetchBudgets();
    }
  };

  const handleAddGoal = async (name: string, target_amount: number, current_amount: number, deadline?: string) => {
    const res = await fetch(`${API_BASE_URL}/api/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, target_amount, current_amount, currency: currencyCode, deadline }),
    });
    if (res.ok) {
      showNotification(`Goal "${name}" Created!`);
      fetchGoals();
    }
  };

  const handleUpdateGoal = async (id: number, new_current_amount: number) => {
    const res = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_amount: new_current_amount }),
    });
    if (res.ok) {
      showNotification('Savings Progress Updated!');
      fetchGoals();
    }
  };

  const handleDeleteGoal = async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/goals/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showNotification('Goal Removed.');
      fetchGoals();
    }
  };

  const handleRefreshInsights = async () => {
    setLoadingInsights(true);
    const result = await getAIInsights(transactions, currencyCode);
    setInsights(result || '');
    setLoadingInsights(false);
    showNotification('AI Analysis Complete!');
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      const res = await fetch(`${API_BASE_URL}/api/settings/clear-data`, { method: 'POST' });
      if (res.ok) {
        await clearCache();
        setRawTransactions([]);
        setRawBudgets([]);
        setRawGoals([]);
        showNotification('All Data Cleared Successfully.', 'info');
      }
    }
  };

  const handleLogout = () => {
    auth.logout();
  };

  const handleAccountAccess = async (action: 'login' | 'register') => {
    const usernameToUse = newUsername.trim();
    if (!usernameToUse) {
      showNotification('Please enter a username/key', 'error');
      return;
    }
    const result = await auth.access(usernameToUse, action);
    if (result.success) {
      showNotification(`Successfully ${action === 'register' ? 'registered' : 'regained'} account: ${usernameToUse}`);
      // Refresh all data
      fetchTransactions();
      fetchBudgets();
      fetchGoals();
    } else {
      showNotification(result.error || 'Operation failed', 'error');
    }
  };

  const handleDownloadData = () => {
    const data = {
      transactions: rawTransactions,
      budgets: rawBudgets,
      goals: rawGoals,
      exportedAt: new Date().toISOString(),
      user: auth.user?.username
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manager_backup_${auth.user?.username || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully!');
  };

  const handleDownloadCSV = () => {
    if (rawTransactions.length === 0) {
      showNotification('No transactions to export', 'error');
      return;
    }
    const headers = ['Date', 'Category', 'Type', 'Amount', 'Currency', 'Description'];
    const rows = rawTransactions.map(t => [
      t.date,
      t.category,
      t.type,
      t.amount,
      t.currency || 'USD',
      `"${t.description.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manager_export_${auth.user?.username || 'user'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('CSV exported successfully!');
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
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

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

        <div className="absolute bottom-0 w-full p-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 text-stone-500 hover:text-red-600 transition-colors w-full px-4 py-3 rounded-xl hover:bg-white/5">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-12 pb-12 px-4 lg:pt-12 lg:pb-12 lg:px-8 max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                Habari, {auth.user?.username || 'User'}!
                {isSyncing && <RefreshCcw className="w-4 h-4 text-primary animate-spin" />}
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-stone-400 text-sm">Real-time financial tracking.</p>
                {lastSynced && (
                    <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                        <Clock className="w-2.5 h-2.5" />
                        Synced {lastSynced.split(',')[1]}
                    </span>
                )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sync to Cloud Button */}
            <button 
                onClick={() => handleSync()}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-stone-300 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                title="Sync data with cloud"
            >
                <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-pulse text-primary' : 'text-stone-500'}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            {/* Global Currency Dropdown */}
            <div className="relative group">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary z-10" />
                <select 
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="pl-10 pr-10 py-2.5 bg-card-dark border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/30 appearance-none transition-all cursor-pointer shadow-xl min-w-[140px]"
                >
                    {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code} className="bg-card-dark">{c.code} ({c.symbol})</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none group-hover:text-white transition-colors" />
            </div>

            {/* Time Range Filter */}
            <div className="relative group hidden md:block">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary z-10" />
                <select 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 pr-10 py-2.5 bg-card-dark border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/30 appearance-none transition-all cursor-pointer shadow-xl min-w-[140px]"
                >
                    <option value="All Time" className="bg-card-dark">All Time</option>
                    <option value="This Month" className="bg-card-dark">This Month</option>
                    <option value="Last Month" className="bg-card-dark">Last Month</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none group-hover:text-white transition-colors" />
            </div>

            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2.5 bg-card-dark rounded-xl border border-border-dark shadow-lg">
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {activeTab === 'Dashboard' && (
            <>
              {/* Mini Stats for Dashboard */}
              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <MiniStatCard label="Balance" amount={balance} currency={currentCurrency.symbol} color="text-primary" />
                <MiniStatCard label="Income" amount={totals.income} currency={currentCurrency.symbol} color="text-emerald-500" />
                <MiniStatCard label="Expenses" amount={totals.expenses} currency={currentCurrency.symbol} color="text-red-500" />
                <MiniStatCard label="Top Category" value={topCategory.category} color="text-amber-500" />
              </div>

              {/* Dashboard: Form and Activity */}
              <div className="lg:col-span-1">
                <TransactionForm onAdd={handleAddTransaction} currency={currentCurrency.symbol} />
              </div>
              <div className="lg:col-span-2 space-y-8">
                <TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} currency={currentCurrency.symbol} />
                <AIInsights
                  insights={insights}
                  loading={loadingInsights}
                  onRefresh={handleRefreshInsights}
                />
              </div>
            </>
          )}

          {activeTab === 'Analytics' && (
            <div className="lg:col-span-3 space-y-8">
              {/* Full Stats Grid in Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Balance"
                  amount={balance}
                  icon={<Wallet className="w-6 h-6 text-primary" />}
                  currency={currentCurrency.symbol}
                />
                <StatCard
                  title="Total Income"
                  amount={totals.income}
                  icon={<ArrowUpCircle className="w-6 h-6 text-emerald-500" />}
                  currency={currentCurrency.symbol}
                />
                <StatCard
                  title="Total Expenses"
                  amount={totals.expenses}
                  icon={<ArrowDownCircle className="w-6 h-6 text-red-500" />}
                  currency={currentCurrency.symbol}
                />
                <div className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Top Spending</span>
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <PieChart className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-white truncate">
                    {topCategory.category}
                  </div>
                  <div className="text-xs text-stone-500 mt-1 font-bold">
                    {currentCurrency.symbol}{topCategory.amount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold px-2 flex items-center gap-2 text-white">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    3D Volume Analysis
                  </h2>
                  <Spending3D data={chartData.length > 0 ? chartData : [{ category: 'No Data', amount: 1 }]} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold px-2 flex items-center gap-2 text-white">
                    <PieChart className="w-5 h-5 text-primary" />
                    Categorized Spending
                  </h2>
                  <PieChart2D 
                    data={chartData.length > 0 ? chartData : [{ category: 'No Data', amount: 1 }]} 
                    currency={currentCurrency.code}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Efficiency & Overview */}
                <div className="md:col-span-1 glass p-8 rounded-3xl flex flex-col items-center justify-center text-center border border-white/5 bg-white/[0.01]">
                  <div className="text-sm font-bold text-stone-500 uppercase tracking-[0.2em] mb-6">Savings Efficiency</div>
                  <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="75" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                          <circle cx="80" cy="80" r="75" stroke="currentColor" strokeWidth="10" fill="transparent" 
                              strokeDasharray={471}
                              strokeDashoffset={471 - (471 * (totals.income > 0 ? Math.max(0, Math.min(100, Math.round(((totals.income - totals.expenses) / totals.income) * 100))) : 0)) / 100}
                              className="text-primary transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                          <div className="text-4xl font-bold text-white font-mono">
                              {totals.income > 0 ? Math.max(0, Math.round(((totals.income - totals.expenses) / totals.income) * 100)) : 0}%
                          </div>
                          <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Rate</div>
                      </div>
                  </div>
                  <p className="mt-8 text-stone-400 text-xs leading-relaxed max-w-[200px]">
                    Percent of income remaining after all categorized expenses.
                  </p>
                </div>

                <div className="md:col-span-1 glass p-8 rounded-3xl border border-white/5 bg-white/[0.01]">
                  <h3 className="text-xs font-bold text-stone-500 mb-6 uppercase tracking-widest">Monthly Summary</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 text-sm">Income</span>
                      <span className="text-emerald-500 font-bold font-mono">
                        +{currentCurrency.symbol}{totals.income.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 text-sm">Expenses</span>
                      <span className="text-red-500 font-bold font-mono">
                        -{currentCurrency.symbol}{totals.expenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-px bg-white/5 my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm">Net Flow</span>
                      <span className="text-primary font-bold text-lg font-mono">
                        {currentCurrency.symbol}{(totals.income - totals.expenses).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-1 glass p-8 rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-stone-500 mb-6 uppercase tracking-widest">Largest Expense</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white truncate max-w-[120px]">
                          {topCategory.category}
                        </div>
                        <div className="text-xs text-stone-500 font-bold font-mono uppercase">
                          {currentCurrency.symbol}{topCategory.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-stone-500 leading-normal italic">
                      "Identifying your largest spending category is the first step toward optimization."
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown List */}
              <div className="glass p-8 rounded-3xl border border-white/5 bg-white/[0.01]">
                <h3 className="text-xs font-bold text-stone-500 mb-6 uppercase tracking-widest">Category Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chartData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-stone-300 text-sm font-medium">{item.category}</span>
                      </div>
                      <span className="text-white font-mono font-bold text-sm">
                        {currentCurrency.symbol}{item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {chartData.length === 0 && <p className="col-span-full text-center text-stone-600 italic py-4">No spending data available for this period.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Investments' && (
            <div className="lg:col-span-3">
              <InvestmentCards investments={investments} currency={currentCurrency.symbol} />
            </div>
          )}

          {activeTab === 'Budgets' && (
            <div className="lg:col-span-3 space-y-8">
              <BudgetManager
                budgets={budgets}
                spendingByCategory={spendingByCategory}
                onSave={handleSaveBudget}
                currency={currentCurrency.symbol}
              />
              <SavingsGoals
                goals={goals}
                onAdd={handleAddGoal}
                onUpdate={handleUpdateGoal}
                onDelete={handleDeleteGoal}
                currency={currentCurrency.symbol}
              />
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="lg:col-span-3">
                <div className="glass p-8 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                      <Settings className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Settings</h2>
                      <p className="text-stone-400">Manage your preferences and data.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mb-4">Account Key Management</h3>
                      <div className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                          <input 
                            type="text" 
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="Enter username/key..."
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-white text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleAccountAccess('register')}
                            className="py-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-bold uppercase hover:bg-primary/20 transition-all"
                          >
                            Register Key
                          </button>
                          <button 
                            onClick={() => handleAccountAccess('login')}
                            className="py-3 bg-white/5 border border-white/10 text-stone-300 rounded-xl text-xs font-bold uppercase hover:bg-white/10 transition-all"
                          >
                            Regain Data
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={handleDownloadData}
                            className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold uppercase hover:bg-emerald-500/20 transition-all"
                          >
                            <Download className="w-4 h-4" />
                            JSON Export
                          </button>
                          <button 
                            onClick={handleDownloadCSV}
                            className="flex items-center justify-center gap-2 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-xs font-bold uppercase hover:bg-blue-500/20 transition-all"
                          >
                            <FileText className="w-4 h-4" />
                            CSV Export
                          </button>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mb-4">Cloud Sync & Security</h3>
                      <div className="space-y-3">
                        <div className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                    <Cloud className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm">Cloud Backup</div>
                                    <div className="text-stone-500 text-[10px] uppercase font-bold tracking-tight">Status: {lastSynced ? 'Active' : 'Not Configured'}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleSync()}
                                disabled={isSyncing}
                                className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-secondary transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {isSyncing ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                                Sync Now
                            </button>
                        </div>

                        <button 
                          onClick={handleClearData}
                          className="w-full flex items-center justify-between px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <Trash2 className="w-5 h-5" />
                            <span className="font-bold">Delete Account Data</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase border border-red-500/30 px-2 py-1 rounded">Permanent</span>
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
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

function StatCard({ title, amount, icon, currency }: { title: string; amount: number; icon: React.ReactNode; currency: string }) {
  return (
    <div className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">{title}</span>
        <div className="p-2 bg-white/5 rounded-lg border border-white/5">{icon}</div>
      </div>
      <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1">
        <span className="text-xs text-stone-500 font-bold">{currency}</span>
        {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

function MiniStatCard({ label, amount, currency, value, color }: { label: string; amount?: number; currency?: string; value?: string; color: string }) {
  return (
    <div className="glass p-3 rounded-xl border border-white/5 bg-white/[0.01]">
      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-tight mb-1">{label}</div>
      <div className={`text-sm font-bold truncate ${color}`}>
        {currency && <span className="text-[10px] mr-0.5 opacity-70">{currency}</span>}
        {amount !== undefined ? amount.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}
      </div>
    </div>
  );
}
