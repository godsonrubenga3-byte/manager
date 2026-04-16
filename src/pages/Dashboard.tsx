import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowUpCircle, ArrowDownCircle, PieChart, LayoutDashboard, Settings, LogOut, Menu, X, Search, Filter, TrendingUp, Target, Trash2, ChevronDown, Globe, Cloud, CheckCircle, Clock, RefreshCcw, Key, Download, FileText, Briefcase, Activity, CheckSquare, Database, Calendar as CalendarIcon, CloudUpload } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import PieChart2D from '../components/PieChart2D';
import Spending3D from '../components/Spending3D';
import InvestmentCards from '../components/InvestmentCards';
import BudgetManager from '../components/BudgetManager';
import SavingsGoals from '../components/SavingsGoals';
import Notification, { NotificationType } from '../components/Notification';
import Calendar from '../components/Calendar';
import TradingJournal from '../components/TradingJournal';
import TradingSimulator from '../components/TradingSimulator';
import TradingAnalytics from '../components/TradingAnalytics';
import InvestingForm from '../components/InvestingForm';
import { Transaction as GeminiTransaction } from '../services/geminiService';
import { Preferences } from '@capacitor/preferences';
import { convertCurrency, fetchLiveRates, STATIC_EXCHANGE_RATES } from '../utils/currency';
import { fetchMarketData } from '../services/marketDataService';
import { requestNotificationPermissions, triggerNotification, scheduleNotification, cancelNotification } from '../utils/notifications';
import { isSameDay } from 'date-fns';
import { syncService } from '../services/syncService';

export interface PriceAlert {
  id: number;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
}

// Extend Transaction to include currency from DB
interface Transaction extends GeminiTransaction {
    currency: string;
}

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
    await Preferences.remove({ key: getCacheKey('events') });
    await Preferences.remove({ key: getCacheKey('memories') });
    await Preferences.remove({ key: getCacheKey('reminders') });
    await Preferences.remove({ key: 'last_synced' });
  };

  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Map path to tab name
  const pathToTab: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/analytics': 'Analytics',
    '/investments': 'Investments',
    '/tradingjournal': 'Trading',
    '/calendar': 'Calendar',
    '/budgets': 'Budgets',
    '/settings': 'Settings'
  };

  // Reverse map for navigation
  const tabToPath: Record<string, string> = {
    'Dashboard': '/dashboard',
    'Analytics': '/analytics',
    'Investments': '/investments',
    'Trading': '/tradingjournal',
    'Calendar': '/calendar',
    'Budgets': '/budgets',
    'Settings': '/settings'
  };

  const activeTab = pathToTab[location.pathname] || 'Dashboard';
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [newUsername, setNewUsername] = useState(auth.user?.username || '');
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // New Features State
  const [todos, setTodos] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [manualInvestments, setManualInvestments] = useState<any[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [tradingCapital, setTradingCapital] = useState({ invested_amount: 0, currency: 'USD' });
  const [liveAssetPrices, setLiveAssetPrices] = useState<Record<string, number | null>>({});

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Poll real-time asset prices for active trades & UI
  useEffect(() => {
    let isMounted = true;
    const fetchPrices = async () => {
      const symbols = ['BTCUSDT', 'BTCUSD', 'BNBUSD', 'GBPJPY', 'XAUUSD', 'UMJATZS'];
      const newPrices: Record<string, number | null> = {};
      for (const symbol of symbols) {
        newPrices[symbol] = await fetchMarketData(symbol);
      }
      if (isMounted) setLiveAssetPrices(prev => ({ ...prev, ...newPrices }));
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Every 10 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  const convertedTrades = useMemo(() => {
    return trades.map(t => ({
      ...t,
      margin_invested: convertCurrency(t.margin_invested, t.currency || 'USD', currencyCode, liveRates),
      pnl: convertCurrency(t.pnl || 0, t.currency || 'USD', currencyCode, liveRates)
    }));
  }, [trades, currencyCode, liveRates]);

  const convertedTradingCapital = useMemo(() => {
    return {
      ...tradingCapital,
      invested_amount: convertCurrency(tradingCapital.invested_amount, tradingCapital.currency || 'USD', currencyCode, liveRates)
    };
  }, [tradingCapital, currencyCode, liveRates]);

  const convertedManualInvestments = useMemo(() => {
    return manualInvestments.map(inv => ({
      ...inv,
      buy_price: convertCurrency(inv.buy_price, inv.currency || 'USD', currencyCode, liveRates),
      total_cost: convertCurrency(inv.total_cost, inv.currency || 'USD', currencyCode, liveRates)
    }));
  }, [manualInvestments, currencyCode, liveRates]);

  useEffect(() => {
    const initRates = async () => {
      const rates = await fetchLiveRates();
      setLiveRates(rates);
    };
    initRates();
  }, []);

  // Check Price Alerts
  useEffect(() => {
    priceAlerts.filter(a => a.isActive).forEach(alert => {
      const currentPrice = liveAssetPrices[alert.symbol];
      if (currentPrice) {
        if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
          triggerNotification(`Price Alert: ${alert.symbol}`, `${alert.symbol} reached ${currentPrice}, which is above your target of ${alert.targetPrice}!`);
          handleTogglePriceAlert(alert.id, false);
        } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
          triggerNotification(`Price Alert: ${alert.symbol}`, `${alert.symbol} reached ${currentPrice}, which is below your target of ${alert.targetPrice}!`);
          handleTogglePriceAlert(alert.id, false);
        }
      }
    });
  }, [liveAssetPrices, priceAlerts]);

  useEffect(() => {
    const loadMetadata = async () => {
      const { value: curr } = await Preferences.get({ key: 'manager_currency' });
      if (curr) setCurrencyCode(curr);
      
      const { value: sync } = await Preferences.get({ key: 'last_synced' });
      if (sync) setLastSynced(sync);

      await fetchPriceAlerts();
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
    if (!auth.user?.username) return;
    if (!silent) setIsSyncing(true);

    try {
      const username = auth.user.username;

      // Sync all tables using the new syncService
      const [
        srvTransactions,
        srvBudgets,
        srvGoals,
        srvTodos,
        srvTrades,
        srvInvestments,
        srvCapital,
        srvEvents,
        srvMemories,
        srvReminders
      ] = await Promise.all([
        syncService.sync(username, 'transactions', 'transactions'),
        syncService.syncUpsert(username, 'budgets', 'budgets', 'category'),
        syncService.sync(username, 'goals', 'goals'),
        syncService.sync(username, 'todos', 'todos'),
        syncService.sync(username, 'trades', 'trades'),
        syncService.sync(username, 'manual_investments', 'manual_investments'),
        syncService.syncSingle(username, 'trading_capital', 'trading_capital'),
        syncService.sync(username, 'events', 'events'),
        syncService.sync(username, 'memories', 'memories'),
        syncService.sync(username, 'reminders', 'reminders')
      ]);

      // Refresh React State from local cache (which was updated by syncService)
      setRawTransactions(srvTransactions || []);
      setRawBudgets(srvBudgets || []);
      setRawGoals(srvGoals || []);
      setTodos(srvTodos || []);
      setTrades(srvTrades || []);
      setManualInvestments(srvInvestments || []);
      if (srvCapital) setTradingCapital(srvCapital);
      setEvents(srvEvents || []);
      setMemories(srvMemories || []);
      setReminders(srvReminders || []);

      const now = new Date().toLocaleString();
      setLastSynced(now);
      await Preferences.set({ key: 'last_synced', value: now });
      if (!silent) showNotification('Turso Sync Complete!');
    } catch (err) {
      console.error("Sync failed:", err);
      if (!silent) showNotification('Sync encountered issues.', 'error');
    } finally {
      if (!silent) setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const fetchTransactions = async () => {
    const data = await getCachedData<Transaction[]>('transactions');
    setRawTransactions(data || []);
  };

  const fetchInvestments = async () => {
    // These are static for now as they were just info
    setInvestments([
      { name: "Index Funds (S&P 500)", expectedReturn: "8-10% p.a.", risk: "Moderate", minAmount: "Varies", description: "Global stock market tracking." },
      { name: "High-Yield Savings", expectedReturn: "4-5% p.a.", risk: "Very Low", minAmount: "None", description: "Safe emergency funds." }
    ] as any);
  };

  const fetchBudgets = async () => {
    const data = await getCachedData<any[]>('budgets');
    setRawBudgets(data || []);
  };

  const fetchGoals = async () => {
    const data = await getCachedData<any[]>('goals');
    setRawGoals(data || []);
  };

  const fetchTodos = async () => {
    const data = await getCachedData<any[]>('todos');
    setTodos(data || []);
  };

  const fetchEvents = async () => {
    const data = await getCachedData<any[]>('events');
    setEvents(data || []);
  };

  const fetchMemories = async () => {
    const data = await getCachedData<any[]>('memories');
    setMemories(data || []);
  };

  const fetchReminders = async () => {
    const data = await getCachedData<any[]>('reminders');
    setReminders(data || []);
  };

  const fetchTrades = async () => {
    const data = await getCachedData<any[]>('trades');
    setTrades(data || []);
  };

  const fetchPriceAlerts = async () => {
    const data = await getCachedData<PriceAlert[]>('price_alerts');
    setPriceAlerts(data || []);
  };

  const handleAddPriceAlert = async (alert: Omit<PriceAlert, 'id' | 'isActive'>) => {
    const current = await getCachedData<PriceAlert[]>('price_alerts') || [];
    const newAlert: PriceAlert = { 
      ...alert, 
      id: Date.now(), 
      isActive: true 
    };
    const updated = [newAlert, ...current];
    await setCachedData('price_alerts', updated);
    setPriceAlerts(updated);
    showNotification('Price alert set!');
  };

  const handleTogglePriceAlert = async (id: number, isActive: boolean) => {
    const current = await getCachedData<PriceAlert[]>('price_alerts') || [];
    const updated = current.map(a => a.id === id ? { ...a, isActive } : a);
    await setCachedData('price_alerts', updated);
    setPriceAlerts(updated);
  };

  const handleDeletePriceAlert = async (id: number) => {
    const current = await getCachedData<PriceAlert[]>('price_alerts') || [];
    const updated = current.filter(a => a.id !== id);
    await setCachedData('price_alerts', updated);
    setPriceAlerts(updated);
    showNotification('Price alert deleted.');
  };

  const fetchTradingCapital = async () => {
    const data = await getCachedData<any>('trading_capital');
    setTradingCapital(data || { invested_amount: 0, currency: 'USD' });
  };

  const fetchManualInvestments = async () => {
    const data = await getCachedData<any[]>('manual_investments');
    setManualInvestments(data || []);
  };

  const handleAddManualInvestment = async (investment: any) => {
    const current = await getCachedData<any[]>('manual_investments') || [];
    const newItem = { 
      ...investment, 
      id: Date.now(),
      username: auth.user?.username 
    };
    const updated = [newItem, ...current];
    await setCachedData('manual_investments', updated);
    setManualInvestments(updated);
    showNotification('Investment added to portfolio!');
  };

  const handleDeleteManualInvestment = async (id: number) => {
    const current = await getCachedData<any[]>('manual_investments') || [];
    const updated = current.filter(i => i.id !== id);
    await setCachedData('manual_investments', updated);
    setManualInvestments(updated);
    showNotification('Investment removed.');
  };

  const handleAddTransaction = async (newTransaction: any) => {
    const current = await getCachedData<Transaction[]>('transactions') || [];
    const newItem = { 
      ...newTransaction, 
      id: Date.now(), 
      currency: currencyCode,
      username: auth.user?.username 
    };
    const updated = [newItem, ...current];
    await setCachedData('transactions', updated);
    setRawTransactions(updated);
    showNotification('Transaction Saved Locally!');
  };

  const handleDeleteTransaction = async (id: number) => {
    const current = await getCachedData<Transaction[]>('transactions') || [];
    const updated = current.filter(t => t.id !== id);
    await setCachedData('transactions', updated);
    setRawTransactions(updated);
    showNotification('Transaction Deleted.');
  };

  const handleSaveBudget = async (category: string, limit_amount: number) => {
    const current = await getCachedData<any[]>('budgets') || [];
    const existingIndex = current.findIndex(b => b.category === category);
    const newBudget = { 
      category, 
      limit_amount, 
      currency: currencyCode, 
      username: auth.user?.username 
    };
    
    let updated;
    if (existingIndex > -1) {
      updated = [...current];
      updated[existingIndex] = newBudget;
    } else {
      updated = [...current, newBudget];
    }
    
    await setCachedData('budgets', updated);
    setRawBudgets(updated);
    showNotification(`${category} Budget Updated!`);
  };

  const handleAddGoal = async (name: string, target_amount: number, current_amount: number, deadline?: string) => {
    const current = await getCachedData<any[]>('goals') || [];
    const newGoal = { 
      id: Date.now(), 
      name, 
      target_amount, 
      current_amount, 
      currency: currencyCode, 
      deadline,
      username: auth.user?.username 
    };
    const updated = [...current, newGoal];
    await setCachedData('goals', updated);
    setRawGoals(updated);
    showNotification(`Goal "${name}" Created!`);
  };

  const handleUpdateGoal = async (id: number, new_current_amount: number) => {
    const current = await getCachedData<any[]>('goals') || [];
    const updated = current.map(g => g.id === id ? { ...g, current_amount: new_current_amount } : g);
    await setCachedData('goals', updated);
    setRawGoals(updated);
    showNotification('Savings Progress Updated!');
  };

  const handleDeleteGoal = async (id: number) => {
    const current = await getCachedData<any[]>('goals') || [];
    const updated = current.filter(g => g.id !== id);
    await setCachedData('goals', updated);
    setRawGoals(updated);
    showNotification('Goal Removed.');
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      await clearCache();
      setRawTransactions([]);
      setRawBudgets([]);
      setRawGoals([]);
      setTodos([]);
      setTrades([]);
      setManualInvestments([]);
      setEvents([]);
      setMemories([]);
      setReminders([]);
      setTradingCapital({ invested_amount: 0, currency: 'USD' });
      showNotification('All Data Cleared Successfully.', 'info');
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
      showNotification(`Successfully ${action === 'register' ? 'registered' : 'logged in'}: ${usernameToUse}`);
      handleSync(true);
    } else {
      showNotification(result.error || 'Operation failed', 'error');
    }
  };

  const handleDownloadData = () => {
    const data = {
      transactions: rawTransactions,
      budgets: rawBudgets,
      goals: rawGoals,
      todos,
      events,
      memories,
      reminders,
      trades,
      manualInvestments,
      tradingCapital,
      exportedAt: new Date().toISOString(),
      user: auth.user?.username
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `manager_backup_${auth.user?.username || 'user'}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
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
    a.style.display = 'none';
    a.href = url;
    a.download = `manager_export_${auth.user?.username || 'user'}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    showNotification('CSV exported successfully!');
  };

  const handleAddTodo = async (task: string, timeFrame?: string, description?: string) => {
    const current = await getCachedData<any[]>('todos') || [];
    const newTodo = { 
      id: Date.now(), 
      task, 
      description,
      is_completed: 0, 
      created_at: new Date().toISOString(),
      time_frame: timeFrame,
      username: auth.user?.username 
    };
    const updated = [newTodo, ...current];
    await setCachedData('todos', updated);
    setTodos(updated);

    // Schedule notification if a specific time is provided (e.g. "14:30")
    if (timeFrame && timeFrame.includes(':')) {
        try {
            const [hours, minutes] = timeFrame.split(':').map(Number);
            const triggerDate = new Date();
            triggerDate.setHours(hours, minutes, 0, 0);
            
            // If time has already passed today, don't schedule (or schedule for tomorrow?)
            // For tasks, usually it's for "today".
            if (triggerDate.getTime() > Date.now()) {
                await scheduleNotification(
                    `Task Reminder: ${newTodo.task}`,
                    newTodo.description || 'Time to get this done!',
                    triggerDate,
                    newTodo.id
                );
            }
        } catch (e) {
            console.error("Failed to parse task time for notification", e);
        }
    }
  };

  const handleToggleTodo = async (id: number, currentStatus: number) => {
    const current = await getCachedData<any[]>('todos') || [];
    const updated = current.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t);
    await setCachedData('todos', updated);
    setTodos(updated);

    // If completed, cancel any pending notification
    if (!currentStatus) { // transitioning to completed
        await cancelNotification(id);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    const current = await getCachedData<any[]>('todos') || [];
    const updated = current.filter(t => t.id !== id);
    await setCachedData('todos', updated);
    setTodos(updated);

    await cancelNotification(id);
  };

  const handleAddEvent = async (event: any) => {
    const current = await getCachedData<any[]>('events') || [];
    const newEvent = { 
      ...event, 
      id: Date.now(),
      username: auth.user?.username 
    };
    const updated = [newEvent, ...current];
    await setCachedData('events', updated);
    setEvents(updated);

    // Schedule notification if reminder_timing is set
    if (newEvent.reminder_timing && newEvent.reminder_timing !== 'none') {
        const eventDate = new Date(newEvent.date);
        const [hours, minutes] = (newEvent.start_time || '00:00').split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);

        const reminderMinutes = parseInt(newEvent.reminder_timing);
        const triggerTime = new Date(eventDate.getTime() - reminderMinutes * 60000);
        
        await scheduleNotification(
            `Upcoming: ${newEvent.title}`,
            `${newEvent.category || 'Event'} starting soon at ${newEvent.start_time}`,
            triggerTime,
            newEvent.id
        );
    }
    
    showNotification('Event added and reminder scheduled!');
  };

  const handleDeleteEvent = async (id: number) => {
    const current = await getCachedData<any[]>('events') || [];
    const updated = current.filter(e => e.id !== id);
    await setCachedData('events', updated);
    setEvents(updated);
    
    await cancelNotification(id);
  };

  const handleAddMemory = async (memory: any) => {
    const current = await getCachedData<any[]>('memories') || [];
    const newMemory = { 
      ...memory, 
      id: Date.now(),
      username: auth.user?.username 
    };
    const updated = [newMemory, ...current];
    await setCachedData('memories', updated);
    setMemories(updated);
    showNotification('New memory recorded!');
  };

  const handleDeleteMemory = async (id: number) => {
    const current = await getCachedData<any[]>('memories') || [];
    const updated = current.filter(m => m.id !== id);
    await setCachedData('memories', updated);
    setMemories(updated);
  };

  const handleAddReminder = async (reminder: any) => {
    const current = await getCachedData<any[]>('reminders') || [];
    const newReminder = { 
      ...reminder, 
      id: Date.now(),
      username: auth.user?.username 
    };
    const updated = [newReminder, ...current];
    await setCachedData('reminders', updated);
    setReminders(updated);

    await scheduleNotification(
        `Reminder: ${newReminder.title}`,
        'Scheduled reminder alert',
        new Date(newReminder.trigger_at),
        newReminder.id
    );

    showNotification('Reminder set!');
  };

  const handleDeleteReminder = async (id: number) => {
    const current = await getCachedData<any[]>('reminders') || [];
    const updated = current.filter(r => r.id !== id);
    await setCachedData('reminders', updated);
    setReminders(updated);
  };

  const handlePlaceTrade = async (trade: any) => {
    // If it comes from the journal, we treat it as a record (closed) unless it's explicitly for the simulator
    // In this app, the Journal is mainly for records.
    const isClosed = trade.win_loss || trade.exit_price || trade.status === 'closed';
    
    let calculatedPnl = trade.pnl || 0;
    if (isClosed && trade.exit_price && !trade.pnl) {
        const entry = trade.entry_price;
        const exit = trade.exit_price;
        const priceDiff = trade.direction === 'Long' ? (exit - entry) / entry : (entry - exit) / entry;
        calculatedPnl = trade.margin_invested * priceDiff * (trade.leverage || 1);
    }

    const newTrade = { 
      ...trade, 
      id: Date.now(), 
      status: isClosed ? 'closed' : 'open', 
      pnl: calculatedPnl,
      currency: currencyCode, 
      username: auth.user?.username,
      created_at: trade.entry_date ? `${trade.entry_date}T${trade.entry_time || '00:00'}:00` : new Date().toISOString(),
      closed_at: isClosed ? (trade.exit_date ? `${trade.exit_date}T${trade.exit_time || '00:00'}:00` : new Date().toISOString()) : undefined
    };
    
    // Strictly Local
    const current = await getCachedData<any[]>('trades') || [];
    const updated = [newTrade, ...current];
    await setCachedData('trades', updated);
    setTrades(updated);
    showNotification('Trade journaled locally (Offline).');

    // If it's a closed trade with PnL, update the capital
    if (isClosed && calculatedPnl !== 0) {
        const newCapitalTotal = convertedTradingCapital.invested_amount + calculatedPnl;
        const newCapital = { 
          invested_amount: newCapitalTotal, 
          currency: currencyCode,
          username: auth.user?.username 
        };
        await setCachedData('trading_capital', newCapital);
        setTradingCapital(newCapital);
    }
  };

  const handleCloseTrade = async (id: number, pnl: number) => {
    // Strictly Local
    const current = await getCachedData<any[]>('trades') || [];
    const updated = current.map(t => t.id === id ? { 
      ...t, 
      status: 'closed', 
      pnl, 
      closed_at: new Date().toISOString(),
      username: auth.user?.username 
    } : t);
    await setCachedData('trades', updated);
    setTrades(updated);

    const newCapitalTotal = convertedTradingCapital.invested_amount + pnl;
    const newCapital = { 
      invested_amount: newCapitalTotal, 
      currency: currencyCode,
      username: auth.user?.username 
    };
    await setCachedData('trading_capital', newCapital);
    setTradingCapital(newCapital);
    showNotification('Trade closed.');
  };

  const handleAllocateCapital = async (amount: number) => {
    const newCapital = { 
      invested_amount: amount, 
      currency: currencyCode,
      username: auth.user?.username 
    };
    
    // Strictly Local
    await setCachedData('trading_capital', newCapital);
    setTradingCapital(newCapital);
    showNotification('Capital updated locally (Offline).');
  };

  // Automated Logic: Convert passed events to memories & Auto-delete old data
  useEffect(() => {
    const processAutomatedTasks = async () => {
      const now = new Date();
      
      // 1. Convert passed events to memories
      const passedEvents = events.filter(e => {
        const eDate = new Date(e.date);
        return eDate < now && !isSameDay(eDate, now);
      });

      if (passedEvents.length > 0) {
        let changed = false;
        const currentMemories = await getCachedData<any[]>('memories') || [];
        const currentEvents = await getCachedData<any[]>('events') || [];
        
        let updatedMemories = [...currentMemories];
        let updatedEvents = [...currentEvents];

        passedEvents.forEach(e => {
          const alreadyMemory = currentMemories.some(m => m.title === e.title && m.date === e.date);
          if (!alreadyMemory) {
            updatedMemories.push({
              id: Date.now() + Math.random(),
              title: e.title,
              date: e.date,
              description: e.description,
              songs_of_the_day: e.songs_of_the_day,
              username: auth.user?.username
            });
            updatedEvents = updatedEvents.filter(ev => ev.id !== e.id);
            changed = true;
          }
        });

        if (changed) {
          await setCachedData('memories', updatedMemories);
          await setCachedData('events', updatedEvents);
          setMemories(updatedMemories);
          setEvents(updatedEvents);
          showNotification('Passed events moved to memories!');
        }
      }

      // 2. Auto-delete tasks and reminders older than 24 hours
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      
      const filteredTodos = todos.filter(t => {
        if (t.is_completed) {
            const age = now.getTime() - new Date(t.created_at).getTime();
            return age < ONE_DAY_MS;
        }
        return true;
      });

      const filteredReminders = reminders.filter(r => {
        const triggerTime = new Date(r.trigger_at).getTime();
        const age = now.getTime() - triggerTime;
        return age < ONE_DAY_MS;
      });

      if (filteredTodos.length !== todos.length) {
        await setCachedData('todos', filteredTodos);
        setTodos(filteredTodos);
      }

      if (filteredReminders.length !== reminders.length) {
        await setCachedData('reminders', filteredReminders);
        setReminders(filteredReminders);
      }
    };

    const interval = setInterval(processAutomatedTasks, 60000); // Check every minute
    processAutomatedTasks();
    return () => clearInterval(interval);
  }, [events, todos, reminders]);

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

  const handleTabClick = (tab: string) => {
    navigate(tabToPath[tab] || '/dashboard');
    setIsSidebarOpen(false);
  };

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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary/30">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Manager</h1>
          </div>

          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => handleTabClick('Dashboard')} />
            <NavItem icon={<PieChart className="w-5 h-5" />} label="Analytics" active={activeTab === 'Analytics'} onClick={() => handleTabClick('Analytics')} />
            <NavItem icon={<Briefcase className="w-5 h-5" />} label="Investments" active={activeTab === 'Investments'} onClick={() => handleTabClick('Investments')} />
            <NavItem icon={<TrendingUp className="w-5 h-5" />} label="Trading" active={activeTab === 'Trading'} onClick={() => handleTabClick('Trading')} />
            <NavItem icon={<CalendarIcon className="w-5 h-5" />} label="Calendar" active={activeTab === 'Calendar'} onClick={() => handleTabClick('Calendar')} />
            <NavItem icon={<Target className="w-5 h-5" />} label="Budgets & Goals" active={activeTab === 'Budgets'} onClick={() => handleTabClick('Budgets')} />
            <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'Settings'} onClick={() => handleTabClick('Settings')} />
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
      <main className="flex-1 pb-12 px-4 lg:pb-12 lg:px-8 max-w-7xl mx-auto w-full">
        <header className="sticky top-0 z-40 flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 mb-8 bg-bg-dark/80 backdrop-blur-xl -mx-4 px-4 lg:-mx-8 lg:px-8 border-b border-white/5">
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
              <div className="lg:col-span-1 space-y-8">
                <TransactionForm onAdd={handleAddTransaction} currency={currentCurrency.symbol} />
                
                {/* Simplified Today's Date & Event */}
                <div 
                  onClick={() => handleTabClick('Calendar')}
                  className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.01] cursor-pointer hover:bg-white/[0.03] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">Today's Highlight</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/5">
                    {events.filter(e => {
                      const eDate = new Date(e.date);
                      const today = new Date();
                      return eDate.getDate() === today.getDate() && 
                             eDate.getMonth() === today.getMonth() && 
                             eDate.getFullYear() === today.getFullYear();
                    }).length > 0 ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-sm font-bold text-stone-200">
                            {events.find(e => {
                              const eDate = new Date(e.date);
                              const today = new Date();
                              return eDate.getDate() === today.getDate() && 
                                     eDate.getMonth() === today.getMonth() && 
                                     eDate.getFullYear() === today.getFullYear();
                            })?.title}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-stone-600 -rotate-90" />
                      </div>
                    ) : (
                      <div className="text-sm text-stone-500 italic flex items-center justify-between">
                        <span>No events scheduled today</span>
                        <ChevronDown className="w-4 h-4 text-stone-600 -rotate-90" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-8">
                <TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} currency={currentCurrency.symbol} />
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
                  {!isMobileScreen ? (
                    <Spending3D data={chartData.length > 0 ? chartData : [{ category: 'No Data', amount: 1 }]} />
                  ) : (
                    <div className="h-[200px] w-full rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-500 text-sm italic">
                      3D Visualization disabled on mobile
                    </div>
                  )}
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

              {/* Trading Analytics */}
              <TradingAnalytics trades={convertedTrades} capital={convertedTradingCapital.invested_amount} currency={currentCurrency.symbol} />
            </div>
          )}

          {activeTab === 'Investments' && (
            <div className="lg:col-span-3 space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InvestingForm onAdd={handleAddManualInvestment} currency={currentCurrency.code} />
                
                <div className="space-y-8">
                  <div className="glass p-8 rounded-3xl border border-white/5 bg-primary/5 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Trading Capital</h3>
                    <p className="text-sm text-stone-400 mb-6">Allocate funds specifically for use in the Trading Simulator.</p>
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-3xl font-bold text-white font-mono">
                        <span className="text-sm text-stone-500 mr-1">{currentCurrency.symbol}</span>
                        {convertedTradingCapital.invested_amount.toLocaleString()}
                      </div>
                      <form onSubmit={(e) => { e.preventDefault(); const amt = parseFloat((e.currentTarget.elements[0] as HTMLInputElement).value); if(amt >= 0) handleAllocateCapital(amt); }} className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm relative">
                        <div className="relative w-full flex-1">
                          <input type="number" step="0.01" min="0" required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/30" placeholder={`Amount in ${currentCurrency.code}...`} />
                        </div>
                        <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 whitespace-nowrap">Update</button>
                      </form>                    </div>
                  </div>

                  <InvestmentCards investments={investments} currency={currentCurrency.symbol} />
                </div>
              </div>

              {/* Portfolio Summary */}
              <div className="glass p-8 rounded-3xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Your Asset Portfolio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {convertedManualInvestments.map((inv) => (
                    <div key={inv.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{inv.asset_type}</div>
                          <h4 className="text-white font-bold">{inv.asset_name}</h4>
                        </div>
                        <button onClick={() => handleDeleteManualInvestment(inv.id)} className="p-1.5 text-stone-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[10px] text-stone-500 uppercase font-bold">Qty</div>
                          <div className="text-sm font-mono text-white">{inv.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-stone-500 uppercase font-bold">Cost</div>
                          <div className="text-sm font-mono text-emerald-500">{currentCurrency.symbol}{inv.total_cost.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {manualInvestments.length === 0 && <div className="col-span-full text-center py-10 text-stone-600 italic">No assets in your portfolio yet.</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Trading' && (
            <div className="lg:col-span-3">
              <TradingJournal
                capital={convertedTradingCapital.invested_amount}
                trades={convertedTrades}
                livePrices={liveAssetPrices}
                onPlaceTrade={handlePlaceTrade}
                onCloseTrade={handleCloseTrade}
                currency={currentCurrency.symbol}
                showNotification={showNotification}
                priceAlerts={priceAlerts}
                onAddPriceAlert={handleAddPriceAlert}
                onTogglePriceAlert={handleTogglePriceAlert}
                onDeletePriceAlert={handleDeletePriceAlert}
              />
            </div>
          )}

          {activeTab === 'Calendar' && (
            <div className="lg:col-span-3 h-[800px]">
              <Calendar 
                todos={todos}
                onAddTodo={handleAddTodo}
                onToggleTodo={handleToggleTodo}
                onDeleteTodo={handleDeleteTodo}
                events={events}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                memories={memories}
                onAddMemory={handleAddMemory}
                onDeleteMemory={handleDeleteMemory}
                reminders={reminders}
                onAddReminder={handleAddReminder}
                onDeleteReminder={handleDeleteReminder}
              />
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
