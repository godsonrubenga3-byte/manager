import React, { useState, useEffect, useRef } from 'react';
import { Activity, CheckCircle, Clock, DollarSign, Image as ImageIcon, Plus, Trash2, TrendingDown, TrendingUp, X, CloudUpload, Info, History, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { triggerNotification } from '../utils/notifications';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

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
  time?: string;
}

interface TradingJournalProps {
  capital: number;
  trades: Trade[];
  livePrices: Record<string, number | null>;
  onPlaceTrade: (trade: Omit<Trade, 'id' | 'status' | 'pnl' | 'created_at'>) => void;
  onCloseTrade: (id: number, pnl: number) => void;
  currency: string;
  showNotification: (message: string, type?: any) => void;
}

const ASSETS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin (Binance)', native: 'USD' },
  { symbol: 'BBTCUSD', name: 'Wrapped BTC (Proxy)', native: 'USD' },
  { symbol: 'GBPJPY', name: 'GBP/JPY (Forex)', native: 'JPY' },
  { symbol: 'XAUUSD', name: 'Gold (PAXG Proxy)', native: 'USD' },
  { symbol: 'UMJATZS', name: 'UMOJA Fund (UTT)', native: 'TZS' },
];

export default function TradingJournal({ capital, trades, livePrices, onPlaceTrade, onCloseTrade, currency, showNotification }: TradingJournalProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'History'>('Overview');
  const [asset, setAsset] = useState(ASSETS[0].symbol);
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [margin, setMargin] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [winLoss, setWinLoss] = useState<'win' | 'loss' | 'breakeven' | ''>('');
  const [exitPrice, setExitPrice] = useState('');
  const [breakevenPrice, setBreakevenPrice] = useState('');
  const [qWhyTaken, setQWhyTaken] = useState('');
  const [qFollowedSetup, setQFollowedSetup] = useState('');
  const [feelingBefore, setFeelingBefore] = useState('');
  const [feelingDuring, setFeelingDuring] = useState('');
  const [feelingAfter, setFeelingAfter] = useState('');
  const [qDistracted, setQDistracted] = useState('');
  const [qTakeAgain, setQTakeAgain] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (livePrices[asset] && !entryPrice) {
      setEntryPrice(livePrices[asset]!.toString());
    }
  }, [asset, livePrices]);

  const resetZoom = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(5, prev + delta)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!tempImage) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslate({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const onMouseUp = () => setIsDragging(false);

  const onWheel = (e: React.WheelEvent) => {
    if (!tempImage) return;
    handleZoom(e.deltaY > 0 ? -0.2 : 0.2);
  };

  const uploadToCloud = async (dataUrl: string): Promise<string> => {
    setIsUploading(true);
    try {
      const base64Data = dataUrl.split(',')[1];
      const formData = new FormData();
      formData.append('image', base64Data);

      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        return result.data.url;
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      showNotification('Image upload failed. Storing locally instead.', 'error');
      return dataUrl; 
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const marginNum = parseFloat(margin);
    if (!marginNum || marginNum <= 0) return;
    if (marginNum > capital) {
      showNotification("Insufficient Trading Capital.", "error");
      return;
    }

    let finalImageUrl = tempImage || undefined;
    if (tempImage) finalImageUrl = await uploadToCloud(tempImage);

    onPlaceTrade({
      asset, direction, entry_price: parseFloat(entryPrice) || (livePrices[asset] || 0),
      take_profit: parseFloat(takeProfit), stop_loss: parseFloat(stopLoss), margin_invested: marginNum,
      image_url: finalImageUrl, leverage: parseFloat(leverage) || 1, win_loss: winLoss || undefined,
      exit_price: parseFloat(exitPrice) || undefined, breakeven_price: parseFloat(breakevenPrice) || undefined,
      q_why_taken: qWhyTaken, q_followed_setup: qFollowedSetup, feeling_before: feelingBefore,
      feeling_during: feelingDuring, feeling_after: feelingAfter, q_distracted: qDistracted,
      q_take_again: qTakeAgain, time: time
    });

    setMargin(''); setTakeProfit(''); setStopLoss(''); setTempImage(null); setWinLoss('');
    setExitPrice(''); setBreakevenPrice(''); setQWhyTaken(''); setQFollowedSetup('');
    setFeelingBefore(''); setFeelingDuring(''); setFeelingAfter(''); setQDistracted(''); setQTakeAgain('');
  };

  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalUsedMargin = trades.filter(t => t.status === 'open').reduce((sum, t) => sum + (t.margin_invested || 0), 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Trading Journal</h2>
          <p className="text-stone-500 text-sm mt-1">Refine your strategy through detailed trade journaling.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full lg:w-auto">
          <button onClick={() => setActiveTab('Overview')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'Overview' ? 'bg-primary text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>
            <Plus className="w-4 h-4" /> Entry
          </button>
          <button onClick={() => setActiveTab('History')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'History' ? 'bg-primary text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>
            <History className="w-4 h-4" /> History
          </button>
        </div>
      </div>

      {activeTab === 'Overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-primary/10 to-transparent text-center sm:text-left">
              <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Total Equity</h3>
              <div className="text-2xl md:text-3xl font-bold font-mono text-white">
                <span className="text-primary text-sm mr-1">{currency}</span>
                {(capital + trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + t.pnl, 0)).toFixed(2)}
              </div>
            </div>
            <div className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.01] text-center sm:text-left">
              <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">In Margin</h3>
              <div className="text-xl md:text-2xl font-bold font-mono text-amber-500">{totalUsedMargin.toFixed(2)}</div>
            </div>
            <div className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.01] text-center sm:text-left">
              <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Free Margin</h3>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-500">{(capital - totalUsedMargin).toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
            {/* Top Grid: Picture Assessment & Trade Details */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="glass p-6 md:p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] shadow-2xl flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Picture Assessment</h3>
                </div>
                
                <div className="space-y-4 flex-1 flex flex-col">
                    <input 
                        type="file" accept="image/*" 
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (re) => setTempImage(re.target?.result as string);
                                reader.readAsDataURL(file);
                                resetZoom();
                            }
                        }}
                        className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                    />

                    <div 
                        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}
                        className="relative w-full h-[300px] lg:h-full lg:min-h-[400px] border-2 border-dashed border-stone-700 rounded-2xl overflow-hidden bg-stone-900/50 flex items-center justify-center cursor-grab active:cursor-grabbing"
                    >
                        {!tempImage ? (
                            <div className="flex flex-col items-center gap-2 text-stone-600">
                                <ImageIcon className="w-10 h-10 opacity-20" />
                                <span className="text-xs font-bold uppercase tracking-tighter">Click Choose File Above</span>
                            </div>
                        ) : (
                            <img 
                                src={tempImage} alt="Assessment" 
                                className="max-w-none transition-transform duration-150 ease-out select-none"
                                style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, maxWidth: '100%', maxHeight: '100%' }}
                            />
                        )}
                    </div>

                    {tempImage && (
                        <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => handleZoom(0.2)} className="p-2 bg-white/5 border border-white/10 rounded-lg text-stone-400 hover:text-white transition-all"><ZoomIn className="w-4 h-4"/></button>
                            <button type="button" onClick={() => handleZoom(-0.2)} className="p-2 bg-white/5 border border-white/10 rounded-lg text-stone-400 hover:text-white transition-all"><ZoomOut className="w-4 h-4"/></button>
                            <button type="button" onClick={resetZoom} className="p-2 bg-white/5 border border-white/10 rounded-lg text-stone-400 hover:text-white transition-all"><RotateCcw className="w-4 h-4"/></button>
                        </div>
                    )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col">
              <div className="glass p-6 md:p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] shadow-2xl flex-1">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Trade Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Date & Time</label>
                    <div className="flex gap-2">
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-primary/30" />
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-24 px-2 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-primary/30 text-center" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Outcome</label>
                    <select value={winLoss} onChange={(e) => setWinLoss(e.target.value as any)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/30 text-xs font-bold appearance-none">
                      <option value="" className="bg-card-dark">Win / Loss =</option>
                      <option value="win" className="bg-card-dark text-emerald-500">WIN</option>
                      <option value="loss" className="bg-card-dark text-red-500">LOSS</option>
                      <option value="breakeven" className="bg-card-dark text-amber-500">BREAKEVEN</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[9px] font-bold text-stone-500 uppercase mb-1">Asset</label>
                        <select value={asset} onChange={(e) => { setAsset(e.target.value); setEntryPrice(''); }} className="w-full px-2 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] outline-none">
                            {ASSETS.map(a => <option key={a.symbol} value={a.symbol} className="bg-card-dark">{a.symbol}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-stone-500 uppercase mb-1">Margin</label>
                        <input type="number" step="0.01" value={margin} onChange={e => setMargin(e.target.value)} className="w-full px-2 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-mono outline-none" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-stone-500 uppercase mb-1">Leverage</label>
                        <input type="number" step="1" value={leverage} onChange={e => setLeverage(e.target.value)} className="w-full px-2 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] outline-none" placeholder="1x" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-stone-500 uppercase mb-1">Direction</label>
                        <button type="button" onClick={() => setDirection(direction === 'Long' ? 'Short' : 'Long')} className={`w-full py-2.5 rounded-lg text-[9px] font-bold transition-all ${direction === 'Long' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{direction.toUpperCase()}</button>
                    </div>
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    <div>
                        <label className="block text-[9px] font-bold text-stone-500 uppercase mb-1">Entry Price</label>
                        <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} className="w-full px-2 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-mono" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-stone-500 uppercase mb-1">Exit Price</label>
                        <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)} className="w-full px-2 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-mono" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-stone-500 uppercase mb-1 text-emerald-500">Take Profit</label>
                        <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="w-full px-2 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-500 text-[10px] font-mono" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-stone-500 uppercase mb-1 text-red-500">Stop Loss</label>
                        <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="w-full px-2 py-2.5 bg-red-500/5 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-mono" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Evaluation Log Spanning Both Columns */}
            <div className="lg:col-span-12">
              <form onSubmit={handleSubmit} className="glass p-6 md:p-10 rounded-[2rem] border border-white/10 bg-white/[0.02] shadow-2xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Evaluation Log</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/[0.01] p-5 border-l-4 border-primary rounded-r-2xl space-y-2">
                                <label className="text-xs font-bold text-stone-300">Q: Why did I take this trade?</label>
                                <textarea value={qWhyTaken} onChange={e => setQWhyTaken(e.target.value)} placeholder="..." className="w-full bg-transparent text-sm text-stone-400 outline-none resize-none min-h-[80px]" />
                            </div>
                            <div className="bg-white/[0.01] p-5 border-l-4 border-primary rounded-r-2xl space-y-2">
                                <label className="text-xs font-bold text-stone-300">Q: Did it follow my setup?</label>
                                <textarea value={qFollowedSetup} onChange={e => setQFollowedSetup(e.target.value)} placeholder="..." className="w-full bg-transparent text-sm text-stone-400 outline-none resize-none min-h-[80px]" />
                            </div>
                            <div className="bg-white/[0.01] p-5 border-l-4 border-primary rounded-r-2xl space-y-2">
                                <label className="text-xs font-bold text-stone-300">Q: Was I distracted or fully focused?</label>
                                <textarea value={qDistracted} onChange={e => setQDistracted(e.target.value)} placeholder="..." className="w-full bg-transparent text-sm text-stone-400 outline-none resize-none min-h-[80px]" />
                            </div>
                            <div className="bg-white/[0.01] p-5 border-l-4 border-primary rounded-r-2xl space-y-2">
                                <label className="text-xs font-bold text-stone-300">Q: Would I take the same trade again?</label>
                                <textarea value={qTakeAgain} onChange={e => setQTakeAgain(e.target.value)} placeholder="..." className="w-full bg-transparent text-sm text-stone-400 outline-none resize-none min-h-[80px]" />
                            </div>
                        </div>

                        <div className="bg-white/[0.01] p-5 border-l-4 border-primary rounded-r-2xl space-y-3">
                            <label className="text-xs font-bold text-stone-300">Q: What was I feeling during, before & after?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                <div className="space-y-1">
                                    <span className="text-[9px] uppercase font-bold text-stone-600">Before</span>
                                    <input type="text" value={feelingBefore} onChange={e => setFeelingBefore(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-300 outline-none" placeholder="e.g., Confident" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] uppercase font-bold text-stone-600">During</span>
                                    <input type="text" value={feelingDuring} onChange={e => setFeelingDuring(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-300 outline-none" placeholder="e.g., Patient" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] uppercase font-bold text-stone-600">After</span>
                                    <input type="text" value={feelingAfter} onChange={e => setFeelingAfter(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-300 outline-none" placeholder="e.g., Grateful" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/4 flex flex-col justify-end">
                        <button type="submit" disabled={capital <= 0 || isUploading} className="w-full py-6 md:py-8 text-white font-bold rounded-2xl transition-all shadow-xl text-lg flex items-center justify-center gap-3 bg-primary hover:bg-secondary disabled:opacity-50 disabled:grayscale relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            {isUploading ? <CloudUpload className="w-6 h-6 animate-bounce" /> : <TrendingUp className="w-6 h-6" />}
                            <span className="relative z-10">{isUploading ? 'Syncing...' : 'Add to Journal'}</span>
                        </button>
                    </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {activeTab === 'History' && (
        <div className="space-y-6">
          <div className="glass p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 bg-white/[0.01] flex flex-col h-full min-h-[400px] md:min-h-[600px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-white">Trade History</h2>
              </div>
              <div className="text-[10px] font-bold text-stone-500 bg-white/5 px-3 py-1.5 rounded-full uppercase tracking-widest w-fit">Last {closedTrades.length} Trades</div>
            </div>

            <div className="space-y-4 md:space-y-6 overflow-y-auto max-h-[800px] md:max-h-[1000px] pr-2 custom-scrollbar">
              {closedTrades.length === 0 ? (
                <div className="text-center py-20 text-stone-700 italic flex flex-col items-center">
                    <Activity className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-10" /> No trades journaled yet.
                </div>
              ) : (
                closedTrades.sort((a,b) => new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime()).map(trade => (
                   <div key={trade.id} className="p-4 md:p-6 bg-white/[0.02] rounded-2xl md:rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-all group">
                     <div className="flex items-start justify-between mb-4 gap-4">
                       <div className="flex gap-3 md:gap-4 min-w-0">
                         {trade.image_url ? (
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden border border-white/10 flex-shrink-0"><img src={trade.image_url} alt="Setup" className="w-full h-full object-cover" /></div>
                         ) : (
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-700 flex-shrink-0"><ImageIcon className="w-5 h-5 md:w-6 md:h-6" /></div>
                         )}
                         <div className="min-w-0">
                           <div className="flex items-center gap-2 mb-1 flex-wrap">
                             <span className="font-bold text-white text-sm md:text-base truncate">{trade.asset}</span>
                             <span className={`text-[9px] md:text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${trade.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{trade.direction} {trade.win_loss ? `- ${trade.win_loss.toUpperCase()}` : ''}</span>
                           </div>
                           <div className="text-[9px] md:text-[10px] text-stone-500 font-bold uppercase tracking-tighter">{new Date(trade.closed_at!).toLocaleDateString()} at {trade.time || new Date(trade.closed_at!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                         </div>
                       </div>
                       <div className={`text-lg md:text-xl font-bold font-mono ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'} whitespace-nowrap`}>{trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}</div>
                     </div>
                     <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                        {trade.q_why_taken && <div className="space-y-1"><span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Reasoning</span><p className="text-[11px] md:text-xs text-stone-400 italic leading-relaxed">"{trade.q_why_taken}"</p></div>}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div><span className="block text-[8px] font-bold text-stone-600 uppercase tracking-widest mb-1">Entry</span><span className="text-[10px] text-stone-300 font-mono">@{trade.entry_price.toLocaleString()}</span></div>
                            <div><span className="block text-[8px] font-bold text-stone-600 uppercase tracking-widest mb-1">Exit</span><span className="text-[10px] text-stone-300 font-mono">@{trade.exit_price?.toLocaleString() || 'N/A'}</span></div>
                            <div><span className="block text-[8px] font-bold text-stone-600 uppercase tracking-widest mb-1">Risk</span><span className="text-[10px] text-stone-300 font-mono">{currency}{trade.margin_invested.toFixed(2)}</span></div>
                            <div><span className="block text-[8px] font-bold text-stone-600 uppercase tracking-widest mb-1">Setup</span><span className="text-[10px] text-stone-300 font-mono">{trade.q_followed_setup ? 'Followed' : 'Broken'}</span></div>
                        </div>
                        {(trade.feeling_before || trade.feeling_during || trade.feeling_after) && (
                            <div className="flex gap-2 flex-wrap">
                                {trade.feeling_before && <span className="text-[8px] bg-white/5 px-2 py-1 rounded text-stone-500 uppercase font-bold">Before: {trade.feeling_before}</span>}
                                {trade.feeling_during && <span className="text-[8px] bg-white/5 px-2 py-1 rounded text-stone-500 uppercase font-bold">During: {trade.feeling_during}</span>}
                                {trade.feeling_after && <span className="text-[8px] bg-white/5 px-2 py-1 rounded text-stone-500 uppercase font-bold">After: {trade.feeling_after}</span>}
                            </div>
                        )}
                     </div>
                   </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
