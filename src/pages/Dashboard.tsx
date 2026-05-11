import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowUpCircle, ArrowDownCircle, PieChart, LayoutDashboard, Settings, LogOut, Menu, X, Search, Filter, TrendingUp, Target, Trash2, ChevronDown, Globe, Cloud, CheckCircle, Clock, RefreshCcw, Key, Download, FileText, Briefcase, Activity, CheckSquare, Database, Calendar as CalendarIcon, CloudUpload, Megaphone, Award, Shield, Bell, Circle, AlarmClock, Volume2 } from 'lucide-react';
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
import TradingAnalytics from '../components/TradingAnalytics';
import InvestingForm from '../components/InvestingForm';
import CustomDropdown, { DropdownOption } from '../components/CustomDropdown';
import { Transaction as GeminiTransaction } from '../services/geminiService';
import { Preferences } from '@capacitor/preferences';
import { convertCurrency, fetchLiveRates, STATIC_EXCHANGE_RATES } from '../utils/currency';
import { fetchMarketData } from '../services/marketDataService';
import { requestNotificationPermissions, triggerNotification, scheduleNotification, cancelNotification } from '../utils/notifications';
import { isSameDay, format, isToday } from 'date-fns';
import { syncService } from '../services/syncService';

export interface PriceAlert {
  id: number;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
}

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
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

  const showNotification = (message: string, type: NotificationType = 'success') => {
    setNotification({ message, type });
  };

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

  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const pathToTab: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/analytics': 'Analytics',
    '/investments': 'Investments',
    '/tradingjournal': 'Trading',
    '/calendar': 'Calendar',
    '/budgets': 'Budgets',
    '/settings': 'Settings'
  };

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

  const currencyOptions: DropdownOption[] = useMemo(() => 
    CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` })), 
  []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [todos, setTodos] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [manualInvestments, setManualInvestments] = useState<any[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [tradingCapital, setTradingCapital] = useState({ invested_amount: 0, currency: 'USD' });
  const [liveAssetPrices, setLiveAssetPrices] = useState<Record<string, number | null>>({});
  const [priceChanges1h, setPriceChanges1h] = useState<Record<string, number>>({});
  const [alarmSoundName, setAlarmSoundName] = useState('Default System');
  const [customSoundData, setCustomSoundData] = useState<string | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<{ title: string; body: string } | null>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Poll for active reminders/tasks to trigger the full-screen alarm overlay
  useEffect(() => {
    const checkAlarms = () => {
        const now = new Date();
        const nowTime = now.getTime();
        
        // Check reminders
        reminders.forEach(r => {
            const triggerTime = new Date(r.trigger_at).getTime();
            // If it's within the window (past 30s or future 10s) and not showing
            if (nowTime >= triggerTime && (nowTime - triggerTime) < 60000 && !activeAlarm) {
                console.log("Triggering reminder alarm:", r.title);
                setActiveAlarm({ title: r.title, body: "Scheduled Reminder" });
                // Trigger an immediate system-level notification as well
                triggerNotification(r.title, "Reminder Alarm Active", r.id, alarmSoundName);
            }
        });

        // Check todos with timeframes
        todos.forEach(t => {
            if (t.time_frame && !t.is_completed) {
                const [h, m] = t.time_frame.split(':').map(Number);
                if (now.getHours() === h && now.getMinutes() === m && !activeAlarm) {
                    console.log("Triggering task alarm:", t.task);
                    setActiveAlarm({ title: t.task, body: "Task Due Now" });
                    triggerNotification(t.task, "Task Due Alarm Active", t.id, alarmSoundName);
                }
            }
        });
    };

    const interval = setInterval(checkAlarms, 5000); // Check every 5 seconds for more accuracy
    return () => clearInterval(interval);
  }, [reminders, todos, activeAlarm]);

  const stopAlarm = () => {
    setActiveAlarm(null);
  };

  const handlePickSound = () => {
    soundInputRef.current?.click();
  };

  const onSoundFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showNotification("File too large (Max 5MB)", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = async (re) => {
            const dataUrl = re.target?.result as string;
            setCustomSoundData(dataUrl);
            setAlarmSoundName(file.name);
            await Preferences.set({ key: 'manager_custom_sound', value: dataUrl });
            await Preferences.set({ key: 'manager_alarm_name', value: file.name });
            showNotification(`Sound Updated: ${file.name}`, "success");
            
            // Preview
            const audio = new Audio(dataUrl);
            audio.play().catch(e => console.error("Audio preview failed", e));
            setTimeout(() => { audio.pause(); audio.currentTime = 0; }, 3000);
        };
        reader.readAsDataURL(file);
    }
  };

  const useDefaultSound = async () => {
    setCustomSoundData(null);
    setAlarmSoundName('Default System');
    await Preferences.remove({ key: 'manager_custom_sound' });
    await Preferences.set({ key: 'manager_alarm_name', value: 'Default System' });
    showNotification("Reset to System Default", "info");
  };

  useEffect(() => {
    let isMounted = true;
    const fetchPrices = async () => {
      const symbols = ['BTCUSDT', 'BTCUSD', 'BNBUSD', 'GBPJPY', 'XAUUSD', 'UMJATZS'];
      const newPrices: Record<string, number | null> = {};
      const newChanges: Record<string, number> = {};
      
      for (const symbol of symbols) {
        const data = await fetchMarketData(symbol);
        if (data) {
            newPrices[symbol] = data.price;
            newChanges[symbol] = data.change1h;
        }
      }
      
      if (isMounted) {
          setLiveAssetPrices(prev => ({ ...prev, ...newPrices }));
          setPriceChanges1h(prev => ({ ...prev, ...newChanges }));
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Polling every 30s
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

  useEffect(() => {
    const loadMetadata = async () => {
      const { value: curr } = await Preferences.get({ key: 'manager_currency' });
      if (curr) setCurrencyCode(curr);
      
      const { value: sync } = await Preferences.get({ key: 'last_synced' });
      if (sync) setLastSynced(sync);

      const { value: soundName } = await Preferences.get({ key: 'manager_alarm_name' });
      if (soundName) setAlarmSoundName(soundName);

      const { value: soundData } = await Preferences.get({ key: 'manager_custom_sound' });
      if (soundData) setCustomSoundData(soundData);

      // Load cached data for immediate display
      const [t, i, b, g, td, e, m, r, tr, cap, pa] = await Promise.all([
        getCachedData<Transaction[]>('transactions'),
        getCachedData<any[]>('manual_investments'),
        getCachedData<any[]>('budgets'),
        getCachedData<any[]>('goals'),
        getCachedData<any[]>('todos'),
        getCachedData<any[]>('events'),
        getCachedData<any[]>('memories'),
        getCachedData<any[]>('reminders'),
        getCachedData<any[]>('trades'),
        getCachedData<any>('trading_capital'),
        getCachedData<PriceAlert[]>('price_alerts')
      ]);

      if (t) setRawTransactions(t);
      if (i) setManualInvestments(i);
      if (b) setRawBudgets(b);
      if (g) setRawGoals(g);
      if (td) setTodos(td);
      if (e) setEvents(e);
      if (m) setMemories(m);
      if (r) setReminders(r);
      if (tr) setTrades(tr);
      if (cap) setTradingCapital(cap);
      if (pa) setPriceAlerts(pa);
    };
    loadMetadata();
  }, [auth.user]);

  const transactions = useMemo(() => {
    let filtered = rawTransactions;
    if (dateFilter !== 'All Time') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = rawTransactions.filter(t => {
        const tDate = new Date(t.date);
        if (dateFilter === 'This Month') return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        if (dateFilter === 'Last Month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear;
        }
        return true;
      });
    }
    return filtered
      .map(t => ({
        ...t,
        amount: convertCurrency(t.amount, t.currency || 'USD', currencyCode, liveRates)
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawTransactions, currencyCode, liveRates, dateFilter]);

  const budgets = useMemo(() => rawBudgets.map(b => ({
    ...b,
    limit_amount: convertCurrency(b.limit_amount, b.currency || 'USD', currencyCode, liveRates)
  })), [rawBudgets, currencyCode, liveRates]);

  const goals = useMemo(() => rawGoals.map(g => ({
    ...g,
    target_amount: convertCurrency(g.target_amount, g.currency || 'USD', currencyCode, liveRates),
    current_amount: convertCurrency(g.current_amount, g.currency || 'USD', currencyCode, liveRates)
  })), [rawGoals, currencyCode, liveRates]);

  const convertedTrades = useMemo(() => trades.map(t => ({
    ...t,
    margin_invested: convertCurrency(t.margin_invested, t.currency || 'USD', currencyCode, liveRates),
    pnl: convertCurrency(t.pnl || 0, t.currency || 'USD', currencyCode, liveRates)
  })), [trades, currencyCode, liveRates]);

  const convertedTradingCapital = useMemo(() => ({
    ...tradingCapital,
    invested_amount: convertCurrency(tradingCapital.invested_amount, tradingCapital.currency || 'USD', currencyCode, liveRates)
  }), [tradingCapital, currencyCode, liveRates]);

  const convertedManualInvestments = useMemo(() => manualInvestments.map(inv => ({
    ...inv,
    buy_price: convertCurrency(inv.buy_price, inv.currency || 'USD', currencyCode, liveRates),
    total_cost: convertCurrency(inv.total_cost, inv.currency || 'USD', currencyCode, liveRates)
  })), [manualInvestments, currencyCode, liveRates]);

  useEffect(() => {
    const saveCurrency = async () => {
      await Preferences.set({ key: 'manager_currency', value: currencyCode });
    };
    saveCurrency();
  }, [currencyCode]);

  const handleSync = async (silent = false) => {
    if (!auth.user?.username) return;
    if (!silent) setIsSyncing(true);
    try {
      const username = auth.user.username;
      const [srvTransactions, srvBudgets, srvGoals, srvTodos, srvTrades, srvInvestments, srvCapital, srvEvents, srvMemories, srvReminders] = await Promise.all([
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
    } finally { if (!silent) setTimeout(() => setIsSyncing(false), 800); }
  };

  const fetchPriceAlerts = async () => {
    const data = await getCachedData<PriceAlert[]>('price_alerts');
    setPriceAlerts(data || []);
  };

  const handleAddPriceAlert = async (alert: Omit<PriceAlert, 'id' | 'isActive'>) => {
    const current = await getCachedData<PriceAlert[]>('price_alerts') || [];
    const newAlert: PriceAlert = { ...alert, id: Date.now(), isActive: true };
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

  const handleAddManualInvestment = async (investment: any) => {
    const current = await getCachedData<any[]>('manual_investments') || [];
    const newItem = { ...investment, id: Date.now(), username: auth.user?.username };
    const updated = [newItem, ...current];
    await setCachedData('manual_investments', updated);
    setManualInvestments(updated);
    handleSync(true);

    // Dual Success Notification
    showNotification('Investment Added!', 'success');
    triggerNotification('Manager Action', 'Success: Information processed.', Date.now(), alarmSoundName);
  };

  const handleDeleteManualInvestment = async (id: number) => {
    const current = await getCachedData<any[]>('manual_investments') || [];
    const updated = current.filter(i => i.id !== id);
    await setCachedData('manual_investments', updated);
    setManualInvestments(updated);
    handleSync(true);
    showNotification('Investment Deleted');
    triggerNotification('Manager Action', 'Success: Investment removed.', id, alarmSoundName);
  };

  const handleAddTransaction = async (newTransaction: any) => {
    const current = await getCachedData<Transaction[]>('transactions') || [];
    const newItem = { ...newTransaction, id: Date.now(), currency: currencyCode, username: auth.user?.username };
    const updated = [newItem, ...current];
    await setCachedData('transactions', updated);
    setRawTransactions(updated);
    handleSync(true);

    // Dual Success Notification
    showNotification('Transaction Saved!', 'success');
    triggerNotification('Manager Action', 'Success: Transaction processed.', Date.now(), alarmSoundName);
  };

  const handleDeleteTransaction = async (id: number) => {
    const current = await getCachedData<any[]>('transactions') || [];
    const updated = current.filter(t => t.id !== id);
    await setCachedData('transactions', updated);
    setRawTransactions(updated);
    handleSync(true);
    showNotification('Transaction Deleted');
    triggerNotification('Manager Action', 'Success: Transaction removed.', id, alarmSoundName);
  };

  const handleSaveBudget = async (category: string, limit_amount: number) => {
    const current = await getCachedData<any[]>('budgets') || [];
    const existingIndex = current.findIndex(b => b.category === category);
    const newBudget = { category, limit_amount, currency: currencyCode, username: auth.user?.username };
    let updated;
    if (existingIndex > -1) { updated = [...current]; updated[existingIndex] = newBudget; }
    else { updated = [...current, newBudget]; }
    await setCachedData('budgets', updated);
    setRawBudgets(updated);
    handleSync(true);

    // Dual Success Notification
    showNotification(`${category} Budget Updated!`, 'success');
    triggerNotification('Manager Action', 'Success: Goal/Budget processed.', Date.now(), alarmSoundName);
  };

  const handleAddGoal = async (name: string, target_amount: number, current_amount: number, deadline?: string) => {
    const current = await getCachedData<any[]>('goals') || [];
    const newGoal = { id: Date.now(), name, target_amount, current_amount, currency: currencyCode, deadline, username: auth.user?.username };
    const updated = [...current, newGoal];
    await setCachedData('goals', updated);
    setRawGoals(updated);
    handleSync(true);

    // Dual Success Notification
    showNotification(`Goal "${name}" Created!`, 'success');
    triggerNotification('Manager Action', 'Success: Goal processed.', newGoal.id, alarmSoundName);
  };

  const handleUpdateGoal = async (id: number, new_current_amount: number) => {
    const current = await getCachedData<any[]>('goals') || [];
    const updated = current.map(g => g.id === id ? { ...g, current_amount: new_current_amount } : g);
    await setCachedData('goals', updated);
    setRawGoals(updated);
    handleSync(true);
    showNotification('Goal Progress Updated');
    triggerNotification('Manager Action', 'Success: Goal progress updated.', id, alarmSoundName);
  };

  const handleDeleteGoal = async (id: number) => {
    const current = await getCachedData<any[]>('goals') || [];
    const updated = current.filter(g => g.id !== id);
    await setCachedData('goals', updated);
    setRawGoals(updated);
    handleSync(true);
    showNotification('Goal Deleted');
    triggerNotification('Manager Action', 'Success: Goal removed.', id, alarmSoundName);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure?')) {
      await Preferences.clear();
      setRawTransactions([]); setRawBudgets([]); setRawGoals([]); setTodos([]); setTrades([]); setManualInvestments([]); setEvents([]); setMemories([]); setReminders([]); setTradingCapital({ invested_amount: 0, currency: 'USD' });
      showNotification('Data Cleared.');
    }
  };

  const handleLogout = () => auth.logout();

  const handleAccountAccess = async (action: 'login' | 'register') => {
    const usernameToUse = newUsername.trim();
    if (!usernameToUse) { showNotification('Please enter a username', 'error'); return; }
    const result = await auth.access(usernameToUse, action);
    if (result.success) { showNotification(`Habari, ${usernameToUse}!`); handleSync(true); }
    else { showNotification(result.error || 'Operation failed', 'error'); }
  };

  const handleDownloadData = () => {
    const data = { transactions: rawTransactions, budgets: rawBudgets, goals: rawGoals, todos, events, memories, reminders, trades, manualInvestments, tradingCapital, exportedAt: new Date().toISOString(), user: auth.user?.username };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `manager_backup_${auth.user?.username || 'user'}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showNotification('Data exported!');
  };

  const handleDownloadCSV = () => {
    if (rawTransactions.length === 0) { showNotification('No transactions', 'error'); return; }
    const headers = ['Date', 'Category', 'Type', 'Amount', 'Currency', 'Description'];
    const rows = rawTransactions.map(t => [t.date, t.category, t.type, t.amount, t.currency || 'USD', `"${t.description.replace(/"/g, '""')}"`]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `manager_export_${auth.user?.username || 'user'}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showNotification('CSV exported!');
  };

  const handleAddTodo = async (task: string, timeFrame?: string, description?: string) => {
    const current = await getCachedData<any[]>('todos') || [];
    const id = Date.now();
    const newTodo = { id, task, description, is_completed: 0, created_at: new Date().toISOString(), time_frame: timeFrame, username: auth.user?.username };
    
    // If a time is provided, schedule an alarm for today at that time
    if (timeFrame) {
        try {
            const today = new Date();
            const [hours, minutes] = timeFrame.split(':').map(Number);
            today.setHours(hours, minutes, 0, 0);
            
            await scheduleNotification(
                `Task Due: ${task}`,
                `Operational alert: ${task} is due now.`,
                today,
                id,
                alarmSoundName
            );
        } catch (e) {
            console.error("Failed to parse time for todo alarm", e);
        }
    }

    const updated = [newTodo, ...current];
    await setCachedData('todos', updated);
    setTodos(updated);
    handleSync(true);
    
    // Dual Success Notification
    showNotification(`Task Created: ${task}`, 'success');
    triggerNotification('Manager Action', `Success: Task "${task}" has been logged and scheduled.`, id, alarmSoundName);
  };

  const handleToggleTodo = async (id: number, currentStatus: number) => {
    const current = await getCachedData<any[]>('todos') || [];
    const updated = current.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t);
    await setCachedData('todos', updated);
    setTodos(updated);
    handleSync(true);
    showNotification('Task Status Updated');
  };

  const handleDeleteTodo = async (id: number) => {
    const current = await getCachedData<any[]>('todos') || [];
    const updated = current.filter(t => t.id !== id);
    await cancelNotification(id);
    await setCachedData('todos', updated);
    setTodos(updated);
    handleSync(true);
    showNotification('Task Deleted');
    triggerNotification('Manager Action', 'Success: Item updated/removed.', Date.now(), alarmSoundName);
  };

  const handleAddEvent = async (event: any) => {
    const current = await getCachedData<any[]>('events') || [];
    const id = Date.now();
    const newEvent = { ...event, id, username: auth.user?.username };
    
    // Schedule an alarm for the event start time
    if (event.date && event.start_time) {
        try {
            const eventDate = new Date(event.date);
            const [hours, minutes] = event.start_time.split(':').map(Number);
            eventDate.setHours(hours, minutes, 0, 0);
            
            await scheduleNotification(
                `Event Starting: ${event.title}`,
                `Schedule alert: ${event.title} is starting now at ${event.location || 'your location'}.`,
                eventDate,
                id,
                alarmSoundName
            );
        } catch (e) {
            console.error("Failed to schedule event alarm", e);
        }
    }

    const updated = [newEvent, ...current];
    await setCachedData('events', updated);
    setEvents(updated);
    handleSync(true);

    // Dual Success Notification
    showNotification(`Event Added: ${event.title}`, 'success');
    triggerNotification('Manager Action', `Success: Event "${event.title}" saved to your calendar.`, id, alarmSoundName);
  };

  const handleDeleteEvent = async (id: number) => {
    const current = await getCachedData<any[]>('events') || [];
    const updated = current.filter(e => e.id !== id);
    await cancelNotification(id);
    await setCachedData('events', updated);
    setEvents(updated);
    handleSync(true);
    showNotification('Event Deleted');
    triggerNotification('Manager Action', 'Success: Event removed.', id, alarmSoundName);
  };

  const handleAddMemory = async (memory: any) => {
    const current = await getCachedData<any[]>('memories') || [];
    const newMemory = { ...memory, id: Date.now(), username: auth.user?.username };
    const updated = [newMemory, ...current];
    await setCachedData('memories', updated);
    setMemories(updated);
  };

  const handleDeleteMemory = async (id: number) => {
    const current = await getCachedData<any[]>('memories') || [];
    const updated = current.filter(m => m.id !== id);
    await setCachedData('memories', updated);
    setMemories(updated);
  };

  const handleAddReminder = async (reminder: any) => {
    const current = await getCachedData<any[]>('reminders') || [];
    const id = Date.now();
    const newReminder = { ...reminder, id, username: auth.user?.username };
    const updated = [newReminder, ...current];
    
    // Schedule a high-priority Alarm for the reminder
    if (reminder.trigger_at) {
        await scheduleNotification(
            `Reminder: ${reminder.title}`,
            `Executive alert for scheduled task: ${reminder.title}`,
            new Date(reminder.trigger_at),
            id,
            alarmSoundName
        );
    }
    
    await setCachedData('reminders', updated);
    setReminders(updated);
    handleSync(true); // Persist to Turso

    // Dual Success Notification
    showNotification(`Reminder Set: ${reminder.title}`, 'success');
    triggerNotification('Manager Action', `Success: Reminder "${reminder.title}" is active.`, id, alarmSoundName);
  };

  const handleDeleteReminder = async (id: number) => {
    const current = await getCachedData<any[]>('reminders') || [];
    const updated = current.filter(r => r.id !== id);
    await cancelNotification(id); // Cancel the scheduled alarm
    await setCachedData('reminders', updated);
    setReminders(updated);
    handleSync(true);
    showNotification('Reminder Deleted');
    triggerNotification('Manager Action', 'Success: Reminder removed.', id, alarmSoundName);
  };

  const handlePlaceTrade = async (trade: any) => {
    const isClosed = trade.win_loss || trade.exit_price || trade.status === 'closed';
    let calculatedPnl = trade.pnl || 0;
    if (isClosed && trade.exit_price && !trade.pnl) {
        const entry = trade.entry_price;
        const exit = trade.exit_price;
        const priceDiff = trade.direction === 'Long' ? (exit - entry) / entry : (entry - exit) / entry;
        calculatedPnl = trade.margin_invested * priceDiff * (trade.leverage || 1);
    }
    const newTrade = { ...trade, id: Date.now(), status: isClosed ? 'closed' : 'open', pnl: calculatedPnl, currency: currencyCode, username: auth.user?.username, created_at: trade.entry_date ? `${trade.entry_date}T${trade.entry_time || '00:00'}:00` : new Date().toISOString(), closed_at: isClosed ? (trade.exit_date ? `${trade.exit_date}T${trade.exit_time || '00:00'}:00` : new Date().toISOString()) : undefined };
    const current = await getCachedData<any[]>('trades') || [];
    const updated = [newTrade, ...current];
    await setCachedData('trades', updated);
    setTrades(updated);
    if (isClosed && calculatedPnl !== 0) {
        const newCapitalTotal = convertedTradingCapital.invested_amount + calculatedPnl;
        const newCapital = { invested_amount: newCapitalTotal, currency: currencyCode, username: auth.user?.username };
        await setCachedData('trading_capital', newCapital);
        setTradingCapital(newCapital);
    }
    handleSync(true);

    // Dual Success Notification
    showNotification(isClosed ? 'Closed Trade Logged' : 'New Position Opened', 'success');
    triggerNotification('Manager Action', `Trade recorded: ${trade.asset} (${trade.direction})`, newTrade.id, alarmSoundName);
  };

  const handleCloseTrade = async (id: number, pnl: number) => {
    const current = await getCachedData<any[]>('trades') || [];
    let assetName = '';
    const updated = current.map(t => {
      if (t.id === id) {
        assetName = t.asset;
        return { ...t, status: 'closed', pnl, closed_at: new Date().toISOString(), username: auth.user?.username };
      }
      return t;
    });
    await setCachedData('trades', updated);
    setTrades(updated);
    const newCapitalTotal = convertedTradingCapital.invested_amount + pnl;
    const newCapital = { invested_amount: newCapitalTotal, currency: currencyCode, username: auth.user?.username };
    await setCachedData('trading_capital', newCapital);
    setTradingCapital(newCapital);
    handleSync(true);

    // Dual Success Notification
    showNotification('Position Closed', 'success');
    triggerNotification('Manager Action', `Success: Position on ${assetName} closed. PnL: ${pnl.toFixed(2)} ${currentCurrency.symbol}`, id, alarmSoundName);
  };

  const handleAllocateCapital = async (amount: number) => {
    const newCapital = { invested_amount: amount, currency: currencyCode, username: auth.user?.username };
    await setCachedData('trading_capital', newCapital);
    setTradingCapital(newCapital);
  };

  const totals = useMemo(() => transactions.reduce((acc, curr) => {
    if (curr.type === 'income') acc.income += curr.amount;
    else acc.expenses += curr.amount;
    return acc;
  }, { income: 0, expenses: 0 }), [transactions]);

  const balance = totals.income - totals.expenses;
  const spendingByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter((t) => t.type === 'expense').forEach((t) => { categories[t.category] = (categories[t.category] || 0) + t.amount; });
    return categories;
  }, [transactions]);
  const chartData = useMemo(() => Object.entries(spendingByCategory).map(([category, amount]) => ({ category, amount })), [spendingByCategory]);
  const filteredTransactions = useMemo(() => transactions.filter((t) => t.category.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase())), [transactions, searchQuery]);
  const topCategory = useMemo(() => chartData.length === 0 ? { category: 'N/A', amount: 0 } : chartData.reduce((prev, current) => (prev.amount > current.amount) ? prev : current), [chartData]);

  const handleTabClick = (tab: string) => { navigate(tabToPath[tab] || '/dashboard'); setIsSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-bg-dark light-theme:bg-bg-light flex text-stone-100 light-theme:text-text-light overflow-x-hidden">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {activeAlarm && (
        <AlarmOverlay 
            title={activeAlarm.title} 
            body={activeAlarm.body} 
            onStop={stopAlarm} 
            sound={alarmSoundName} 
            customSoundData={customSoundData}
        />
      )}

      {/* Sidebar Layout */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-card-dark border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Manager</h1>
          </div>

          <nav className="space-y-1 flex-1">
            <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => handleTabClick('Dashboard')} />
            <NavItem icon={<Activity className="w-5 h-5" />} label="Trading" active={activeTab === 'Trading'} onClick={() => handleTabClick('Trading')} />
            <NavItem icon={<PieChart className="w-5 h-5" />} label="Analytics" active={activeTab === 'Analytics'} onClick={() => handleTabClick('Analytics')} />
            <NavItem icon={<Briefcase className="w-5 h-5" />} label="Investments" active={activeTab === 'Investments'} onClick={() => handleTabClick('Investments')} />
            <NavItem icon={<CalendarIcon className="w-5 h-5" />} label="Calendar" active={activeTab === 'Calendar'} onClick={() => handleTabClick('Calendar')} />
            <NavItem icon={<Target className="w-5 h-5" />} label="Budgets" active={activeTab === 'Budgets'} onClick={() => handleTabClick('Budgets')} />
            <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'Settings'} onClick={() => handleTabClick('Settings')} />
          </nav>

          <div className="mt-auto">
            <button onClick={handleLogout} className="flex items-center gap-3 text-stone-500 hover:text-white transition-colors w-full px-4 py-2 rounded-xl hover:bg-white/5">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col relative">
        {/* Stationary Floating Glassy Header */}
        <header className="fixed top-8 lg:top-4 left-4 lg:left-[19rem] right-4 z-40 glass-nav rounded-[1.5rem] px-4 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl transition-all duration-300">
          <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold text-white light-theme:text-text-light flex items-center gap-3">
                Habari, {auth.user?.username || 'User'}!
                {isSyncing && <RefreshCcw className="w-4 h-4 text-primary animate-spin" />}
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 mt-1">
                <p className="text-stone-400 light-theme:text-stone-600 text-xs truncate hidden sm:block">Real-time tracking and synchronization.</p>
                {lastSynced && (
                    <span className="text-[10px] text-stone-600 light-theme:text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1 bg-white/5 light-theme:bg-black/5 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        <Clock className="w-2.5 h-2.5" />
                        Synced {lastSynced.split(',')[1]}
                    </span>
                )}
            </div>
          </div>
          
          <div className="flex items-center justify-between w-full md:w-auto gap-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 bg-card-dark light-theme:bg-card-light rounded-xl border border-white/5 light-theme:border-black/5 shadow-lg">
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
                <CustomDropdown 
                    options={currencyOptions} 
                    value={currencyCode} 
                    onChange={setCurrencyCode}
                    className="min-w-[120px]"
                    buttonClassName="px-3 py-2 text-xs font-bold bg-card-dark border-white/10 light-theme:border-black/10"
                    icon={<Globe className="w-3.5 h-3.5 text-primary" />}
                    align="right"
                />

                <button onClick={() => handleSync()} disabled={isSyncing} className="p-2 bg-white/5 light-theme:bg-black/5 border border-white/10 light-theme:border-black/10 rounded-xl hover:bg-white/10 light-theme:hover:bg-black/10 transition-all">
                    <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-primary' : 'text-stone-500'}`} />
                </button>
            </div>
          </div>
        </header>

        {/* Content with Spacer for the Fixed Header */}
        <div className="p-4 lg:p-8 pt-[220px] md:pt-[140px] max-w-7xl mx-auto w-full space-y-8">
          {activeTab === 'Dashboard' && (
            <>
              {/* Mini Stats for Dashboard */}
              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <MiniStatCard label="Balance" amount={balance} currency={currentCurrency.symbol} color="text-primary" />
                <MiniStatCard label="Income" amount={totals.income} currency={currentCurrency.symbol} color="text-emerald-500" />
                <MiniStatCard label="Expenses" amount={totals.expenses} currency={currentCurrency.symbol} color="text-red-500" />
                <MiniStatCard label="Top Category" value={topCategory.category} color="text-amber-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-8">
                  <TransactionForm onAdd={handleAddTransaction} currency={currentCurrency.symbol} />
                </div>
                <div className="lg:col-span-8 space-y-8">
                  <DashboardCalendar events={events} todos={todos} reminders={reminders} />
                  <TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} currency={currentCurrency.symbol} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'Analytics' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Balance" amount={balance} icon={<Wallet className="w-5 h-5 text-primary" />} currency={currentCurrency.symbol} />
                <StatCard title="Total Income" amount={totals.income} icon={<ArrowUpCircle className="w-5 h-5 text-emerald-500" />} currency={currentCurrency.symbol} />
                <StatCard title="Total Expenses" amount={totals.expenses} icon={<ArrowDownCircle className="w-5 h-5 text-red-500" />} currency={currentCurrency.symbol} />
                <div className="glass p-6 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
                  <div className="text-stone-500 light-theme:text-stone-600 text-[10px] font-bold uppercase tracking-widest mb-2">Top Spending</div>
                  <div className="text-xl font-bold text-white light-theme:text-text-light truncate">{topCategory.category}</div>
                  <div className="text-sm text-stone-500 light-theme:text-stone-600 mt-1 font-mono">{currentCurrency.symbol}{topCategory.amount.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white px-2">Category Distribution</h3>
                  <PieChart2D data={chartData.length > 0 ? chartData : [{ category: 'No Data', amount: 1 }]} currency={currentCurrency.code} />
                </div>
              </div>

              <TradingAnalytics trades={convertedTrades} capital={convertedTradingCapital.invested_amount} currency={currentCurrency.symbol} />
            </div>
          )}

          {activeTab === 'Investments' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <InvestingForm onAdd={handleAddManualInvestment} currency={currentCurrency.code} />
                <div className="space-y-8">
                  <div className="glass p-8 rounded-3xl bg-primary/10 border border-primary/20 text-center">
                    <h3 className="text-lg font-bold text-white mb-4">Trading Capital</h3>
                    <div className="text-4xl font-bold text-white font-mono mb-8">
                        <span className="text-sm text-stone-500 mr-2">{currentCurrency.symbol}</span>
                        {convertedTradingCapital.invested_amount.toLocaleString()}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); const amt = parseFloat((e.currentTarget.elements[0] as HTMLInputElement).value); if(amt >= 0) handleAllocateCapital(amt); }} className="flex gap-3 max-w-sm mx-auto">
                        <input type="number" step="0.01" min="0" required className="flex-1 px-4 py-3 glass-input rounded-2xl text-white text-sm" placeholder="Update capital..." />
                        <button type="submit" className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">Update</button>
                    </form>
                  </div>
                  <InvestmentCards investments={investments} currency={currentCurrency.symbol} />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white px-2">Asset Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {convertedManualInvestments.map((inv) => (
                    <div key={inv.id} className="glass p-6 rounded-3xl border border-white/5 light-theme:border-black/5 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{inv.asset_type}</div>
                          <h4 className="text-lg font-bold text-white light-theme:text-text-light">{inv.asset_name}</h4>
                        </div>
                        <button onClick={() => handleDeleteManualInvestment(inv.id)} className="p-2 text-stone-700 light-theme:text-stone-600 hover:text-red-500 transition-all">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 light-theme:border-black/5">
                        <div><div className="text-[10px] text-stone-600 light-theme:text-stone-500 uppercase font-bold mb-1">Qty</div><div className="text-sm font-mono text-white light-theme:text-text-light">{inv.quantity}</div></div>
                        <div className="text-right"><div className="text-[10px] text-stone-600 light-theme:text-stone-500 uppercase font-bold mb-1">Cost</div><div className="text-sm font-mono text-emerald-500">{currentCurrency.symbol}{inv.total_cost.toLocaleString()}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Trading' && (
            <TradingJournal 
               capital={convertedTradingCapital.invested_amount} 
               trades={convertedTrades} 
               livePrices={liveAssetPrices} 
               priceChanges1h={priceChanges1h}
               alarmSound={alarmSoundName}
               onPlaceTrade={handlePlaceTrade} 
               onCloseTrade={handleCloseTrade} 
               currency={currentCurrency.symbol} 
               showNotification={showNotification} 
               priceAlerts={priceAlerts} 
               onAddPriceAlert={handleAddPriceAlert} 
               onTogglePriceAlert={handleTogglePriceAlert} 
               onDeletePriceAlert={handleDeletePriceAlert} 
            />
          )}
          {activeTab === 'Calendar' && (
            <div className="lg:col-span-3">
              <Calendar todos={todos} onAddTodo={handleAddTodo} onToggleTodo={handleToggleTodo} onDeleteTodo={handleDeleteTodo} events={events} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} memories={memories} onAddMemory={handleAddMemory} onDeleteMemory={handleDeleteMemory} reminders={reminders} onAddReminder={handleAddReminder} onDeleteReminder={handleDeleteReminder} />
            </div>
          )}

          {activeTab === 'Budgets' && (
            <div className="space-y-12">
              <BudgetManager budgets={budgets} spendingByCategory={spendingByCategory} onSave={handleSaveBudget} currency={currentCurrency.symbol} />
              <SavingsGoals goals={goals} onAdd={handleAddGoal} onUpdate={handleUpdateGoal} onDelete={handleDeleteGoal} currency={currentCurrency.symbol} />
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
                            JSON Backup
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

                    <section>
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mb-4">Legal & Privacy</h3>
                      <div className="glass p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                        <button 
                          onClick={() => navigate('/privacy')}
                          className="flex items-center justify-between w-full p-4 bg-white/5 border border-white/10 rounded-xl text-stone-300 hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-stone-500 group-hover:text-white" />
                            <span className="font-bold">Privacy Policy</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-stone-600 -rotate-90" />
                        </button>
                        <button 
                          onClick={() => navigate('/terms')}
                          className="flex items-center justify-between w-full p-4 bg-white/5 border border-white/10 rounded-xl text-stone-300 hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-stone-500 group-hover:text-white" />
                            <span className="font-bold">Terms & Conditions</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-stone-600 -rotate-90" />
                        </button>
                      </div>
                    </section>
                    <section>
                      <h3 className="text-xs font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-[0.2em] mb-4">Alarm & Reminder Sounds</h3>
                      <div className="glass p-6 rounded-2xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01] space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Megaphone className="w-5 h-5" /></div>
                                <div>
                                    <div className="text-sm font-bold text-white light-theme:text-text-light">Current Sound</div>
                                    <div className="text-[10px] text-stone-500 light-theme:text-stone-600 uppercase font-bold truncate max-w-[150px]">{alarmSoundName}</div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <input 
                                    ref={soundInputRef}
                                    type="file"
                                    accept="audio/*"
                                    onChange={onSoundFileChange}
                                    className="hidden"
                                />
                                <button 
                                    onClick={handlePickSound}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all uppercase tracking-widest"
                                >
                                    Choose MP3/WAV
                                </button>
                                <button 
                                    onClick={useDefaultSound}
                                    className="px-4 py-2 bg-white/5 light-theme:bg-black/5 border border-white/10 light-theme:border-black/10 text-stone-500 text-xs font-bold rounded-xl hover:bg-white/10 light-theme:hover:bg-black/10 transition-all uppercase tracking-widest"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-white/5 light-theme:bg-black/5 p-4 rounded-xl border border-dashed border-white/10 light-theme:border-black/10">
                            <p className="text-[10px] text-stone-500 light-theme:text-stone-600 italic leading-relaxed">
                                Pick any song from your device to use as your personal alarm. The app will ring persistently and vibrate with a "Bell" pulse until you stop it.
                            </p>
                        </div>
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
    <button onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group w-full text-left ${active ? 'bg-primary text-white shadow-lg scale-[1.02]' : 'text-stone-500 light-theme:text-stone-600 hover:text-white light-theme:hover:text-text-light hover:bg-white/5 light-theme:hover:bg-black/5'}`}>
      <div className={`${active ? 'text-white' : 'text-stone-600 light-theme:text-stone-500'} transition-colors`}>{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function StatCard({ title, amount, icon, currency }: { title: string; amount: number; icon: React.ReactNode; currency: string }) {
  return (
    <div className="glass p-6 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-stone-500 light-theme:text-stone-600 font-bold uppercase tracking-widest text-[9px]">{title}</span>
        <div className="p-2 bg-white/5 light-theme:bg-black/5 rounded-xl border border-white/5 light-theme:border-black/5">{icon}</div>
      </div>
      <div className="text-2xl font-bold font-mono text-white light-theme:text-text-light flex items-baseline gap-1">
        <span className="text-xs text-stone-500 light-theme:text-stone-600 font-bold">{currency}</span>
        {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

function MiniStatCard({ label, amount, currency, value, color }: { label: string; amount?: number; currency?: string; value?: string; color: string }) {
  return (
    <div className="glass p-3 rounded-xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
      <div className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-tight mb-1">{label}</div>
      <div className={`text-sm font-bold truncate ${color}`}>
        {currency && <span className="text-[10px] mr-0.5 opacity-70">{currency}</span>}
        {amount !== undefined ? amount.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}
      </div>
    </div>
  );
}

function DashboardCalendar({ events, todos, reminders }: { events: any[], todos: any[], reminders: any[] }) {
  const today = new Date();
  const todayEvents = events.filter(e => isToday(new Date(e.date)));
  const todayTasks = todos.filter(t => t.created_at && isToday(new Date(t.created_at)));
  const todayReminders = reminders.filter(r => isToday(new Date(r.trigger_at)));

  const totalItems = todayEvents.length + todayTasks.length + todayReminders.length;

  return (
    <div className="glass p-6 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01] space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-white light-theme:text-text-light flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          Today's Schedule
        </h2>
        <div className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest bg-white/5 light-theme:bg-black/5 px-2 py-1 rounded-full">
          {format(today, 'MMM dd, yyyy')}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {totalItems === 0 ? (
          <div className="text-center py-6 text-stone-600 light-theme:text-stone-400 italic text-sm border border-dashed border-white/5 light-theme:border-black/5 rounded-xl">
            Nothing scheduled for today.
          </div>
        ) : (
          <>
            {todayEvents.map(e => (
              <div key={`ev-${e.id}`} className="flex items-center justify-between p-3 bg-white/5 light-theme:bg-black/5 border border-white/5 light-theme:border-black/5 rounded-xl group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${e.color || 'bg-primary'}`} />
                  <div>
                    <div className="text-sm font-bold text-stone-200 light-theme:text-text-light">{e.title}</div>
                    <div className="text-[10px] text-stone-500 light-theme:text-stone-600 font-bold uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {e.start_time} - {e.end_time}
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-black text-stone-600 light-theme:text-stone-500 uppercase tracking-widest bg-white/5 light-theme:bg-black/5 px-2 py-0.5 rounded-md">Event</div>
              </div>
            ))}

            {todayReminders.map(r => (
              <div key={`rem-${r.id}`} className="flex items-center justify-between p-3 bg-white/5 light-theme:bg-black/5 border border-white/5 light-theme:border-black/5 rounded-xl group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-bold text-stone-200 light-theme:text-text-light">{r.title}</div>
                    <div className="text-[10px] text-stone-500 light-theme:text-stone-600 font-bold uppercase">
                      At {format(new Date(r.trigger_at), 'h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-black text-stone-600 light-theme:text-stone-500 uppercase tracking-widest bg-white/5 light-theme:bg-black/5 px-2 py-0.5 rounded-md">Reminder</div>
              </div>
            ))}

            {todayTasks.map(t => (
              <div key={`task-${t.id}`} className="flex items-center justify-between p-3 bg-white/5 light-theme:bg-black/5 border border-white/5 light-theme:border-black/5 rounded-xl group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-3">
                  {t.is_completed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-stone-600" />}
                  <div>
                    <div className={`text-sm font-bold ${t.is_completed ? 'line-through text-stone-600' : 'text-stone-200 light-theme:text-text-light'}`}>{t.task}</div>
                    {t.time_frame && <div className="text-[10px] text-stone-500 light-theme:text-stone-600 font-bold uppercase">Due: {t.time_frame}</div>}
                  </div>
                </div>
                <div className="text-[9px] font-black text-stone-600 light-theme:text-stone-500 uppercase tracking-widest bg-white/5 light-theme:bg-black/5 px-2 py-0.5 rounded-md">Task</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function AlarmOverlay({ title, body, onStop, sound, customSoundData }: { title: string; body: string; onStop: () => void; sound: string; customSoundData?: string | null }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Persistent audio ringing
        const playSound = async () => {
            try {
                // If we have custom sound data (base64), use it. Otherwise, we'd normally look in res/raw for bundled files.
                // Since we can't easily access bundled files by string name in a webview without native bridges,
                // we'll rely on a fallback strategy.
                const source = customSoundData || '/alarm.wav'; 
                const audio = new Audio(source);
                audio.loop = true;
                audioRef.current = audio;
                await audio.play();
            } catch (e) {
                console.warn("Audio playback failed, trying system fallback...", e);
            }
        };

        playSound();

        // Continuous vibration pattern until stopped
        if ('vibrate' in navigator) {
            const vInterval = setInterval(() => {
                navigator.vibrate([1000, 200, 1000, 200, 2000]);
            }, 3000);
            return () => {
                clearInterval(vInterval);
                navigator.vibrate(0);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
            };
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [customSoundData]);

    return (
        <div className="fixed inset-0 z-[300] bg-primary flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-10 animate-bounce">
                <AlarmClock className="w-16 h-16 text-white" />
            </div>

            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">{title}</h1>
            <p className="text-white/60 text-lg mb-16 font-bold uppercase tracking-widest">{body}</p>

            <button 
                onClick={onStop}
                className="w-full max-w-sm py-8 bg-white text-primary font-black text-2xl rounded-[2.5rem] shadow-2xl active:scale-95 transition-all uppercase tracking-tighter italic"
            >
                Stop Alarm
            </button>

            <div className="mt-10 flex items-center gap-2 text-white/40">
                <Volume2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Ringing: {sound}</span>
            </div>
        </div>
    );
}
