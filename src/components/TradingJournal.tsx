import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, CheckCircle, Clock, DollarSign, Image as ImageIcon, Plus, Trash2, TrendingDown, TrendingUp, X, CloudUpload, Info, History, ZoomIn, ZoomOut, RotateCcw, Bell, AlertTriangle } from 'lucide-react';
import { triggerNotification } from '../utils/notifications';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PriceAlert } from '../pages/Dashboard';
import CustomDropdown, { DropdownOption } from './CustomDropdown';

export interface Trade {
  id: number;
  asset: string;
  direction: 'Long' | 'Short';
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  margin_invested: number;
  status: 'open' | 'closed';
  pnl: number;
  created_at: string;
  closed_at?: string;
  notes?: string;
  image_url?: string;
  leverage?: number;
  win_loss?: 'win' | 'loss' | 'breakeven';
  exit_price?: number;
  breakeven_price?: number;
  q_why_taken?: string;
  q_followed_setup?: string;
  feeling_before?: string;
  feeling_during?: string;
  feeling_after?: string;
  q_distracted?: string;
  q_take_again?: string;
  entry_time?: string;
  exit_time?: string;
  entry_date?: string;
  exit_date?: string;
}

interface TradingJournalProps {
  capital: number;
  trades: Trade[];
  livePrices: Record<string, number | null>;
  priceChanges1h: Record<string, number>;
  alarmSound: string;
  onPlaceTrade: (trade: Omit<Trade, 'id' | 'status' | 'pnl' | 'created_at'>) => void;
  onCloseTrade: (id: number, pnl: number) => void;
  currency: string;
  showNotification: (message: string, type?: any) => void;
  priceAlerts: PriceAlert[];
  onAddPriceAlert: (alert: Omit<PriceAlert, 'id' | 'isActive'>) => void;
  onTogglePriceAlert: (id: number, isActive: boolean) => void;
  onDeletePriceAlert: (id: number) => void;
}

const ASSETS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin (Binance)', native: 'USD' },
  { symbol: 'BTCUSD', name: 'Bitcoin (Wrapped)', native: 'USD' },
  { symbol: 'BNBUSD', name: 'Binance Coin', native: 'USD' },
  { symbol: 'GBPJPY', name: 'GBP/JPY (Forex)', native: 'JPY' },
  { symbol: 'XAUUSD', name: 'Gold Spot', native: 'USD' },
  { symbol: 'UMJATZS', name: 'UMOJA Fund (UTT)', native: 'TZS' },
];

export default function TradingJournal({ 
  capital, trades, livePrices, priceChanges1h, alarmSound, onPlaceTrade, onCloseTrade, currency, showNotification,
  priceAlerts, onAddPriceAlert, onTogglePriceAlert, onDeletePriceAlert
}: TradingJournalProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'History' | 'Alerts'>('Overview');
  const [asset, setAsset] = useState(ASSETS[0].symbol);
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [margin, setMargin] = useState('');
  const [volume, setVolume] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [leverage, setLeverage] = useState('1000');

  // Monitor Open Trades for TP / SL Hits (Strengthened Logic)
  useEffect(() => {
    const openTrades = trades.filter(t => t.status === 'open');
    openTrades.forEach(trade => {
      const currentPrice = livePrices[trade.asset];
      if (!currentPrice) return;
      let hitType: 'TP' | 'SL' | null = null;
      if (trade.direction === 'Long') {
        if (trade.take_profit && currentPrice >= trade.take_profit) hitType = 'TP';
        else if (trade.stop_loss && currentPrice <= trade.stop_loss) hitType = 'SL';
      } else {
        if (trade.take_profit && currentPrice <= trade.take_profit) hitType = 'TP';
        else if (trade.stop_loss && currentPrice >= trade.stop_loss) hitType = 'SL';
      }
      if (hitType) {
        const entry = trade.entry_price;
        const exit = currentPrice;
        const priceDiff = trade.direction === 'Long' ? (exit - entry) / entry : (entry - exit) / entry;
        const finalPnl = trade.margin_invested * priceDiff * (trade.leverage || 1);
        onCloseTrade(trade.id, finalPnl);
        triggerNotification(`Position Closed: ${trade.asset}`, `Executive Alert: Your ${trade.direction} hit ${hitType}! PnL: ${finalPnl >= 0 ? '+' : ''}${finalPnl.toFixed(2)} ${currency}`, trade.id, alarmSound);
      }
    });
  }, [livePrices, trades, onCloseTrade, currency]);

  // Alert Form State
  const [alertSymbol, setAlertSymbol] = useState(ASSETS[0].symbol);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');

  useEffect(() => {
    const p = parseFloat(entryPrice);
    const v = parseFloat(volume);
    const l = parseFloat(leverage);
    if (p && v && l && l > 0) {
      setMargin(((p * v) / l).toFixed(2));
    }
  }, [entryPrice, volume, leverage]);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState(new Date().toTimeString().slice(0, 5));
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitTime, setExitTime] = useState(new Date().toTimeString().slice(0, 5));
  const [winLoss, setWinLoss] = useState<'win' | 'loss' | 'breakeven' | ''>('');
  const [exitPrice, setExitPrice] = useState('');
  const [breakevenPrice, setBreakevenPrice] = useState('');
  const [qWhyTaken, setQWhyTaken] = useState('');
  const [qFollowedSetup, setQFollowedSetup] = useState('');
  const [feelingBefore, setFeelingBefore] = useState('');
  const [feelingDuring, setFeelingDuring] = useState('');
  const [feelingAfter, setFeelingAfter] = useState('');

  const assetOptions: DropdownOption[] = useMemo(() => ASSETS.map(a => ({
    value: a.symbol,
    label: a.symbol,
    icon: priceChanges1h[a.symbol] !== undefined ? (
        priceChanges1h[a.symbol] >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />
    ) : undefined
  })), [priceChanges1h]);

  const outcomeOptions: DropdownOption[] = [
    { value: '', label: 'Win/Loss?' },
    { value: 'win', label: 'WIN', color: 'text-emerald-500' },
    { value: 'loss', label: 'LOSS', color: 'text-red-500' },
    { value: 'breakeven', label: 'B/E', color: 'text-amber-500' },
  ];
  const [qDistracted, setQDistracted] = useState('');
  const [qTakeAgain, setQTakeAgain] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (livePrices[asset] && !entryPrice) {
      setEntryPrice(livePrices[asset]!.toString());
    }
  }, [asset, livePrices]);

  const resetZoom = () => { setScale(1); setTranslate({ x: 0, y: 0 }); };
  const handleZoom = (delta: number) => { setScale(prev => Math.max(0.5, Math.min(5, prev + delta))); };
  const onMouseDown = (e: React.MouseEvent) => { if (!tempImage) return; setIsDragging(true); dragStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y }; };
  const onMouseMove = (e: React.MouseEvent) => { if (!isDragging) return; setTranslate({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const onMouseUp = () => setIsDragging(false);
  const onWheel = (e: React.WheelEvent) => { if (!tempImage) return; handleZoom(e.deltaY > 0 ? -0.2 : 0.2); };

  const uploadToCloud = async (dataUrl: string): Promise<string> => {
    setIsUploading(true);
    try {
      const base64Data = dataUrl.split(',')[1];
      const formData = new FormData();
      formData.append('image', base64Data);
      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: 'POST', body: formData });
      const result = await response.json();
      if (result.success) return result.data.url;
      else throw new Error(result.error?.message || 'Upload failed');
    } catch (error) { showNotification('Image upload failed. Storing locally instead.', 'error'); return dataUrl; }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const marginNum = parseFloat(margin);
    if (!marginNum || marginNum <= 0) return;
    const usedMargin = trades.filter(t => t.status === 'open').reduce((sum, t) => sum + (t.margin_invested || 0), 0);
    if (marginNum + usedMargin > capital) {
      showNotification("Insufficient Trading Capital.", "error");
      return;
    }

    try {
      let finalImageUrl = tempImage || undefined;
      if (tempImage) finalImageUrl = await uploadToCloud(tempImage);
      const isClosed = winLoss || exitPrice;
      await onPlaceTrade({ asset, direction, entry_price: parseFloat(entryPrice) || (livePrices[asset] || 0), take_profit: parseFloat(takeProfit), stop_loss: parseFloat(stopLoss), margin_invested: marginNum, image_url: finalImageUrl, leverage: parseFloat(leverage) || 1, win_loss: winLoss || undefined, exit_price: parseFloat(exitPrice) || undefined, breakeven_price: parseFloat(breakevenPrice) || undefined, q_why_taken: qWhyTaken, q_followed_setup: qFollowedSetup, feeling_before: feelingBefore, feeling_during: feelingDuring, feeling_after: feelingAfter, q_distracted: qDistracted, q_take_again: qTakeAgain, entry_time: entryTime, entry_date: entryDate, exit_time: exitTime, exit_date: exitDate });
      showNotification(isClosed ? "Trade journaled!" : "Position tracked!", "success");
      setMargin(''); setTakeProfit(''); setStopLoss(''); setTempImage(null); setWinLoss(''); setExitPrice(''); setBreakevenPrice(''); setQWhyTaken(''); setQFollowedSetup('');
      setFeelingBefore(''); setFeelingDuring(''); setFeelingAfter(''); setQDistracted(''); setQTakeAgain('');
    } catch (error: any) { showNotification(error.message || "Failed.", "error"); }
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertPrice) return;
    onAddPriceAlert({ symbol: alertSymbol, targetPrice: parseFloat(alertPrice), condition: alertCondition });
    setAlertPrice('');
  };

  const closedTrades = trades.filter(t => t.status === 'closed');
  const activeTrades = trades.filter(t => t.status === 'open');
  const totalUsedMargin = activeTrades.reduce((sum, t) => sum + (t.margin_invested || 0), 0);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-2xl font-bold text-white light-theme:text-text-light tracking-tight">Trading</h2>
          <p className="text-stone-400 light-theme:text-stone-600 text-sm mt-1">Detailed performance tracking.</p>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 glass-nav rounded-2xl shadow-2xl scale-90 sm:scale-100 whitespace-nowrap">
        <button onClick={() => setActiveTab('Overview')} className={`nav-item-glass ${activeTab === 'Overview' ? 'active' : 'text-stone-400 light-theme:text-stone-500'}`}><Plus className="w-5 h-5" /><span className="text-[10px] font-bold uppercase tracking-widest">Entry</span></button>
        <button onClick={() => setActiveTab('Alerts')} className={`nav-item-glass ${activeTab === 'Alerts' ? 'active' : 'text-stone-400 light-theme:text-stone-500'}`}><Bell className="w-5 h-5" /><span className="text-[10px] font-bold uppercase tracking-widest">Alerts</span></button>
        <button onClick={() => setActiveTab('History')} className={`nav-item-glass ${activeTab === 'History' ? 'active' : 'text-stone-400 light-theme:text-stone-500'}`}><History className="w-5 h-5" /><span className="text-[10px] font-bold uppercase tracking-widest">History</span></button>
      </div>

      {activeTab === 'Overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass p-6 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
              <h3 className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-1">Total Equity</h3>
              <div className="text-2xl font-bold font-mono text-white light-theme:text-text-light"><span className="text-base text-primary mr-1">{currency}</span>{(capital + trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + t.pnl, 0)).toFixed(2)}</div>
            </div>
            <div className="glass p-6 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
              <h3 className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-1">In Margin</h3>
              <div className="text-xl font-bold font-mono text-amber-500">{totalUsedMargin.toFixed(2)}</div>
            </div>
            <div className="glass p-6 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
              <h3 className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-1">Free Margin</h3>
              <div className="text-xl font-bold font-mono text-emerald-500">{(capital - totalUsedMargin).toFixed(2)}</div>
            </div>
          </div>

          {activeTrades.length > 0 && (
            <div className="glass p-6 rounded-3xl border border-white/5 light-theme:border-black/5">
                <h3 className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />Live Positions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTrades.map(trade => {
                        const currentPrice = livePrices[trade.asset];
                        let unrealizedPnl = 0;
                        if (currentPrice) {
                            const diff = trade.direction === 'Long' ? (currentPrice - trade.entry_price) / trade.entry_price : (trade.entry_price - currentPrice) / trade.entry_price;
                            unrealizedPnl = trade.margin_invested * diff * (trade.leverage || 1);
                        }
                        const isProfit = unrealizedPnl >= 0;
                        return (
                        <div key={trade.id} className="p-4 bg-white/5 light-theme:bg-black/5 rounded-2xl border border-white/5 light-theme:border-black/5 flex items-center justify-between">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${trade.direction === 'Long' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{trade.direction}</span>
                                    <span className="font-bold text-white light-theme:text-text-light text-sm">{trade.asset}</span>
                                    {priceChanges1h[trade.asset] !== undefined && (
                                        <span className={`text-[9px] font-mono flex items-center gap-0.5 ${priceChanges1h[trade.asset] >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {priceChanges1h[trade.asset] >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                            {Math.abs(priceChanges1h[trade.asset]).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-stone-500 light-theme:text-stone-600 font-mono">Entry: {trade.entry_price.toLocaleString()} | SL: {trade.stop_loss || 'None'}</div>
                            </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <div className={`text-sm font-bold font-mono ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>{isProfit ? '+' : ''}{unrealizedPnl.toFixed(2)}</div>
                                    <button onClick={() => onCloseTrade(trade.id, unrealizedPnl)} className="px-3 py-1 bg-white/5 light-theme:bg-black/5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-[10px] font-bold uppercase border border-white/5 light-theme:border-black/5 transition-all">Close</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col">
              <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01] flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6"><div className="w-2 h-2 rounded-full bg-primary" /><h3 className="text-base font-bold text-stone-400 light-theme:text-stone-600 uppercase tracking-widest">Picture Assessment</h3></div>
                <div className="space-y-4 flex-1 flex flex-col">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (re) => setTempImage(re.target?.result as string); reader.readAsDataURL(file); resetZoom(); } }} className="w-full text-sm text-stone-500 light-theme:text-stone-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer" />
                    <div onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel} className="relative w-full h-[300px] lg:h-full lg:min-h-[400px] border border-dashed border-white/10 light-theme:border-black/10 rounded-2xl overflow-hidden bg-black/20 light-theme:bg-black/5 flex items-center justify-center cursor-grab active:cursor-grabbing">
                        {!tempImage ? (<div className="flex flex-col items-center gap-2 text-stone-600 light-theme:text-stone-400"><ImageIcon className="w-10 h-10 opacity-10" /><span className="text-[10px] font-bold uppercase tracking-widest">Select Trade Screen</span></div>) : (<img src={tempImage} alt="Setup" className="max-w-none transition-transform duration-150 select-none" style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, maxWidth: '100%', maxHeight: '100%' }} />)}
                    </div>
                    {tempImage && (
                        <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => handleZoom(0.2)} className="p-2 bg-white/5 light-theme:bg-black/5 border border-white/10 light-theme:border-black/10 rounded-lg text-stone-400 light-theme:text-stone-600 hover:text-white light-theme:hover:text-text-light"><ZoomIn className="w-4 h-4"/></button>
                            <button type="button" onClick={() => handleZoom(-0.2)} className="p-2 bg-white/5 light-theme:bg-black/5 border border-white/10 light-theme:border-black/10 rounded-lg text-stone-400 light-theme:text-stone-600 hover:text-white light-theme:hover:text-text-light"><ZoomOut className="w-4 h-4"/></button>
                            <button type="button" onClick={resetZoom} className="p-2 bg-white/5 light-theme:bg-black/5 border border-white/10 light-theme:border-black/10 rounded-lg text-stone-400 light-theme:text-stone-600 hover:text-white light-theme:hover:text-text-light"><RotateCcw className="w-4 h-4"/></button>
                            <button type="button" onClick={() => { setTempImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; resetZoom(); }} className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500/20"><X className="w-4 h-4"/></button>
                        </div>
                    )}
                </div>
              </div>
              </div>

              <div className="lg:col-span-6 flex flex-col">
              <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01] flex-1">
                <div className="flex items-center gap-2 mb-6"><div className="w-2 h-2 rounded-full bg-primary" /><h3 className="text-base font-bold text-stone-400 light-theme:text-stone-600 uppercase tracking-widest">Trade Details</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                     <label className="block text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-1.5">Asset</label>
                     <CustomDropdown 
                       options={assetOptions} 
                       value={asset} 
                       onChange={(val) => { setAsset(val); setEntryPrice(''); }}
                       buttonClassName="px-4 py-2.5"
                     />
                  </div>
                  <div className="col-span-1"><label className="block text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-1.5">Direction</label><button type="button" onClick={() => setDirection(direction === 'Long' ? 'Short' : 'Long')} className={`w-full py-2.5 rounded-xl text-[10px] font-bold transition-all ${direction === 'Long' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{direction.toUpperCase()}</button></div>
                  <div className="col-span-1">
                       <label className="block text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-1.5">Outcome</label>
                       <CustomDropdown 
                           options={outcomeOptions} 
                           value={winLoss} 
                           onChange={(val) => setWinLoss(val as any)}
                           buttonClassName="px-4 py-2.5 font-bold"
                       />
                   </div>
                  <div className="col-span-1"><label className="block text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-1.5">Volume (Lots)</label><input type="number" step="0.01" value={volume} onChange={e => setVolume(e.target.value)} className="w-full px-4 py-2.5 glass-input rounded-xl text-white light-theme:text-text-light text-sm font-mono" placeholder="1.00" /></div>
                  <div className="col-span-1"><label className="block text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-1.5">Entry Price</label><input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} className="w-full px-4 py-2.5 glass-input rounded-xl text-white light-theme:text-text-light text-sm font-mono" /></div>
                  <div className="col-span-1"><label className="block text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-1.5">Exit Price</label><input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)} className="w-full px-4 py-2.5 glass-input rounded-xl text-white light-theme:text-text-light text-sm font-mono" /></div>
                  <div className="col-span-1"><label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Take Profit</label><input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="w-full px-4 py-2.5 glass-input rounded-xl border-emerald-500/20 text-emerald-500 text-sm font-mono" /></div>
                  <div className="col-span-1"><label className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Stop Loss</label><input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="w-full px-4 py-2.5 glass-input rounded-xl border-red-500/20 text-red-500 text-sm font-mono" /></div>
                </div>
              </div>
              </div>

              <div className="lg:col-span-12">
              <form onSubmit={handleSubmit} className="glass p-6 md:p-10 rounded-2xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01] relative overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <h3 className="text-base font-bold text-stone-400 light-theme:text-stone-600 uppercase tracking-widest">Evaluation Log</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/[0.01] light-theme:bg-black/[0.01] p-5 border-l-4 border-primary rounded-r-xl space-y-2">
                                <label className="text-sm font-bold text-stone-300 light-theme:text-stone-700">Q: Why did I take this trade?</label>
                                <textarea value={qWhyTaken} onChange={e => setQWhyTaken(e.target.value)} placeholder="..." className="w-full bg-transparent text-base text-stone-400 light-theme:text-stone-600 outline-none resize-none min-h-[80px]" />
                            </div>
                            <div className="bg-white/[0.01] light-theme:bg-black/[0.01] p-5 border-l-4 border-primary rounded-r-xl space-y-2">
                                <label className="text-sm font-bold text-stone-300 light-theme:text-stone-700">Q: Did it follow my setup?</label>
                                <textarea value={qFollowedSetup} onChange={e => setQFollowedSetup(e.target.value)} placeholder="..." className="w-full bg-transparent text-base text-stone-400 light-theme:text-stone-600 outline-none resize-none min-h-[80px]" />
                            </div>
                            <div className="bg-white/[0.01] light-theme:bg-black/[0.01] p-5 border-l-4 border-primary rounded-r-xl space-y-2">
                                <label className="text-sm font-bold text-stone-300 light-theme:text-stone-700">Q: Was I distracted or fully focused?</label>
                                <textarea value={qDistracted} onChange={e => setQDistracted(e.target.value)} placeholder="..." className="w-full bg-transparent text-base text-stone-400 light-theme:text-stone-600 outline-none resize-none min-h-[80px]" />
                            </div>
                            <div className="bg-white/[0.01] light-theme:bg-black/[0.01] p-5 border-l-4 border-primary rounded-r-xl space-y-2">
                                <label className="text-sm font-bold text-stone-300 light-theme:text-stone-700">Q: Would I take the same trade again?</label>
                                <textarea value={qTakeAgain} onChange={e => setQTakeAgain(e.target.value)} placeholder="..." className="w-full bg-transparent text-base text-stone-400 light-theme:text-stone-600 outline-none resize-none min-h-[80px]" />
                            </div>
                        </div>

                        <div className="bg-white/[0.01] light-theme:bg-black/[0.01] p-5 border-l-4 border-primary rounded-r-xl space-y-3">
                            <label className="text-sm font-bold text-stone-300 light-theme:text-stone-700">Q: What was I feeling during, before & after?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                <div className="space-y-1">
                                    <span className="text-[11px] uppercase font-bold text-stone-500 light-theme:text-stone-600">Before</span>
                                    <input type="text" value={feelingBefore} onChange={e => setFeelingBefore(e.target.value)} className="w-full glass-input rounded-lg border-white/10 light-theme:border-black/10 px-3 py-2 text-sm text-stone-300 light-theme:text-stone-700 outline-none" placeholder="e.g., Confident" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] uppercase font-bold text-stone-500 light-theme:text-stone-600">During</span>
                                    <input type="text" value={feelingDuring} onChange={e => setFeelingDuring(e.target.value)} className="w-full glass-input rounded-lg border-white/10 light-theme:border-black/10 px-3 py-2 text-sm text-stone-300 light-theme:text-stone-700 outline-none" placeholder="e.g., Patient" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] uppercase font-bold text-stone-500 light-theme:text-stone-600">After</span>
                                    <input type="text" value={feelingAfter} onChange={e => setFeelingAfter(e.target.value)} className="w-full glass-input rounded-lg border-white/10 light-theme:border-black/10 px-3 py-2 text-sm text-stone-300 light-theme:text-stone-700 outline-none" placeholder="e.g., Grateful" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/4 flex flex-col justify-end">
                        <button type="submit" disabled={capital <= 0 || isUploading} className="px-8 py-4 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                            {isUploading ? <CloudUpload className="w-5 h-5 animate-bounce" /> : <TrendingUp className="w-5 h-5" />}
                            <span>{isUploading ? 'Syncing...' : 'Log & Track'}</span>
                        </button>
                    </div>
                </div>
              </form>
              </div>          </div>
        </>
      )}

      {activeTab === 'Alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
              <h3 className="text-xs font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Bell className="w-4 h-4" /> Set Alert</h3>
              <form onSubmit={handleAddAlert} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest">Asset</label>
                    <CustomDropdown 
                        options={assetOptions} 
                        value={alertSymbol} 
                        onChange={setAlertSymbol}
                        buttonClassName="px-4 py-2.5"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setAlertCondition('above')} className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${alertCondition === 'above' ? 'bg-primary text-white shadow-md' : 'text-stone-500 light-theme:text-stone-600 hover:text-stone-300 light-theme:hover:text-stone-700'}`}>ABOVE</button>
                    <button type="button" onClick={() => setAlertCondition('below')} className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${alertCondition === 'below' ? 'bg-primary text-white shadow-md' : 'text-stone-500 light-theme:text-stone-600 hover:text-stone-300 light-theme:hover:text-stone-700'}`}>BELOW</button>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest">Price</label><input type="number" step="0.00000001" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} className="w-full px-4 py-2.5 glass-input rounded-xl text-white light-theme:text-text-light text-sm font-mono" /></div>
                <button type="submit" className="w-full py-4 bg-primary hover:bg-secondary text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Set Alert</button>
              </form>
            </div>
            <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01] flex flex-col h-[500px]">
              <h3 className="text-xs font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity className="w-4 h-4" /> Active Alerts</h3>
              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                {priceAlerts.length === 0 ? (<div className="text-center py-20 text-stone-700 light-theme:text-stone-400 italic text-xs">No active alerts.</div>) : (priceAlerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${alert.isActive ? 'bg-white/5 light-theme:bg-black/5 border-white/5 light-theme:border-black/5' : 'bg-transparent border-transparent opacity-50'}`}>
                      <div><div className="font-bold text-white light-theme:text-text-light text-sm">{alert.symbol}</div><div className="text-[9px] text-stone-500 light-theme:text-stone-600 uppercase font-bold">{alert.condition} {alert.targetPrice.toLocaleString()}</div></div>
                      <div className="flex items-center gap-2"><button onClick={() => onTogglePriceAlert(alert.id, !alert.isActive)} className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${alert.isActive ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{alert.isActive ? 'Disable' : 'Enable'}</button><button onClick={() => onDeletePriceAlert(alert.id)} className="p-1.5 text-stone-700 light-theme:text-stone-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>
                    </div>
                  )))}
              </div>
            </div>
        </div>
      )}

      {activeTab === 'History' && (
        <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01] flex flex-col min-h-[600px]">
          <h3 className="text-xs font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-8 flex items-center gap-2"><Activity className="w-4 h-4" /> History ({closedTrades.length})</h3>
          <div className="space-y-6 overflow-y-auto max-h-[800px] custom-scrollbar">
            {closedTrades.length === 0 ? (<div className="text-center py-20 text-stone-700 light-theme:text-stone-400 italic text-xs">No history yet.</div>) : (closedTrades.sort((a,b) => new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime()).map(trade => (
                 <div key={trade.id} className="p-5 bg-white/[0.01] light-theme:bg-black/[0.01] rounded-2xl border border-white/5 light-theme:border-black/5 hover:bg-white/[0.03] light-theme:hover:bg-black/[0.02] transition-all">
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex gap-4 min-w-0">
                       {trade.image_url ? (<div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 light-theme:border-black/10 flex-shrink-0"><img src={trade.image_url} alt="S" className="w-full h-full object-cover" /></div>) : (<div className="w-12 h-12 rounded-xl bg-white/5 light-theme:bg-black/5 flex items-center justify-center text-stone-700 light-theme:text-stone-500 flex-shrink-0"><ImageIcon className="w-5 h-5" /></div>)}
                       <div className="min-w-0">
                         <div className="flex items-center gap-2 mb-1 flex-wrap"><span className="font-bold text-white light-theme:text-text-light text-sm truncate">{trade.asset}</span><span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${trade.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{trade.direction}</span></div>
                         <div className="text-[9px] text-stone-600 light-theme:text-stone-500 font-bold uppercase">{new Date(trade.closed_at!).toLocaleDateString()} at {new Date(trade.closed_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                       </div>
                     </div>
                     <div className={`text-lg font-bold font-mono ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}</div>
                   </div>
                 </div>
              )))}
          </div>
        </div>
      )}
    </div>
  );
}
