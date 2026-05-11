import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Music, 
  Bell, 
  CheckSquare, 
  History, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  Clock,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Circle,
  MapPin,
  Tag,
  Repeat,
  FileText,
  X
} from 'lucide-react';
import { format, isToday, isPast, isSameDay, addDays, subDays } from 'date-fns';
import CustomDropdown, { DropdownOption } from './CustomDropdown';

interface Task {
  id: number;
  task: string;
  description?: string;
  is_completed: number;
  time_frame?: string;
  created_at?: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  description?: string;
  is_all_day: boolean;
  start_time?: string;
  end_time?: string;
  songs_of_the_day?: string;
  location?: string;
  category?: string;
  color?: string;
  reminder_timing?: string;
  recurrence?: string;
}

interface Memory {
  id: number;
  title: string;
  date: string;
  favorite_song?: string;
  spotify_link?: string;
  description?: string;
  songs_of_the_day?: string;
}

interface Reminder {
  id: number;
  title: string;
  trigger_at: string;
  event_id?: number;
}

interface CalendarProps {
  todos: Task[];
  onAddTodo: (task: string, timeFrame?: string, description?: string) => void;
  onToggleTodo: (id: number, status: number) => void;
  onDeleteTodo: (id: number) => void;
  events: Event[];
  onAddEvent: (event: Omit<Event, 'id'>) => void;
  onDeleteEvent: (id: number) => void;
  memories: Memory[];
  onAddMemory: (memory: Omit<Memory, 'id'>) => void;
  onDeleteMemory: (id: number) => void;
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id'>) => void;
  onDeleteReminder: (id: number) => void;
}

type Tab = 'Events' | 'Memories' | 'Reminders' | 'Tasks';

const CATEGORIES = [
  { name: 'General', color: 'bg-stone-500' },
  { name: 'Work', color: 'bg-blue-500' },
  { name: 'Personal', color: 'bg-emerald-500' },
  { name: 'Study', color: 'bg-amber-500' },
  { name: 'Finance', color: 'bg-primary' },
  { name: 'Health', color: 'bg-red-500' }
];

const categoryOptions: DropdownOption[] = CATEGORIES.map(c => ({ 
    value: c.name, 
    label: c.name,
    icon: <div className={`w-2 h-2 rounded-full ${c.color}`} />
}));

const REMINDER_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'At time of event', value: '0' },
  { label: '5 minutes before', value: '5' },
  { label: '15 minutes before', value: '15' },
  { label: '30 minutes before', value: '30' },
  { label: '1 hour before', value: '60' },
  { label: '1 day before', value: '1440' }
];

const RECURRENCE_OPTIONS = ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

export default function Calendar({ 
  todos, onAddTodo, onToggleTodo, onDeleteTodo,
  events, onAddEvent, onDeleteEvent,
  memories, onAddMemory, onDeleteMemory,
  reminders, onAddReminder, onDeleteReminder
}: CalendarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Events');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newExtra, setNewExtra] = useState(''); 
  const [newSongs, setNewSongs] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0].name);
  const [newReminderTiming, setNewReminderTiming] = useState(REMINDER_OPTIONS[0].value);
  const [newRecurrence, setNewRecurrence] = useState(RECURRENCE_OPTIONS[0]);
  const [newDescription, setNewDescription] = useState('');

  const filteredEvents = useMemo(() => events.filter(e => isSameDay(new Date(e.date), selectedDate)), [events, selectedDate]);
  const filteredTasks = useMemo(() => todos.filter(t => t.created_at && isSameDay(new Date(t.created_at), selectedDate)), [todos, selectedDate]);
  const filteredMemories = useMemo(() => memories.filter(m => isSameDay(new Date(m.date), selectedDate)), [memories, selectedDate]);
  const todayEvents = useMemo(() => events.filter(e => isToday(new Date(e.date))), [events]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const dateStr = selectedDate.toISOString();
    if (activeTab === 'Tasks') onAddTodo(newTitle, newTime, newDescription);
    else if (activeTab === 'Events') {
      onAddEvent({ title: newTitle, date: dateStr, is_all_day: !newTime && !newEndTime, description: newExtra, start_time: newTime || '00:00', end_time: newEndTime || '23:59', songs_of_the_day: newSongs, location: newLocation, category: newCategory, color: CATEGORIES.find(c => c.name === newCategory)?.color || 'bg-stone-500', reminder_timing: newReminderTiming, recurrence: newRecurrence });
    } else if (activeTab === 'Memories') onAddMemory({ title: newTitle, date: dateStr, favorite_song: newSongs, spotify_link: newExtra, description: newTitle });
    else if (activeTab === 'Reminders') {
      const triggerDate = new Date(selectedDate);
      if (newTime) { const [hours, minutes] = newTime.split(':').map(Number); triggerDate.setHours(hours, minutes, 0, 0); }
      onAddReminder({ title: newTitle, trigger_at: triggerDate.toISOString() });
    }
    setNewTitle(''); setNewTime(''); setNewEndTime(''); setNewExtra(''); setNewSongs(''); setNewLocation(''); setNewCategory(CATEGORIES[0].name); setNewReminderTiming(REMINDER_OPTIONS[0].value); setNewRecurrence(RECURRENCE_OPTIONS[0]); setNewDescription(''); setShowAddModal(false);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Dashboard-Style Header for Calendar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white light-theme:text-text-light tracking-tight">Calendar</h2>
          <p className="text-stone-400 light-theme:text-stone-600 text-sm mt-1">Operational schedule & reminders.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          <span>New {activeTab === 'Memories' ? 'Memory' : activeTab.slice(0, -1)}</span>
        </button>
      </div>

      {/* 2. STATIONARY FLOATING NAV (Matching Trading Hub) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 glass-nav rounded-2xl shadow-2xl scale-90 sm:scale-100 whitespace-nowrap">
        <NavTab tab="Events" active={activeTab} onClick={setActiveTab} icon={<CalendarIcon className="w-5 h-5" />} />
        <NavTab tab="Memories" active={activeTab} onClick={setActiveTab} icon={<History className="w-5 h-5" />} />
        <NavTab tab="Reminders" active={activeTab} onClick={setActiveTab} icon={<Bell className="w-5 h-5" />} />
        <NavTab tab="Tasks" active={activeTab} onClick={setActiveTab} icon={<CheckSquare className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Date and Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01]">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-2 hover:bg-white/5 light-theme:hover:bg-black/5 rounded-lg text-stone-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white light-theme:text-text-light">{format(selectedDate, 'MMMM yyyy')}</h3>
                    <p className="text-xs text-primary font-bold uppercase tracking-widest">{format(selectedDate, 'EEEE, do')}</p>
                </div>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-white/5 light-theme:hover:bg-black/5 rounded-lg text-stone-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            
            <div className="pt-6 border-t border-white/5 light-theme:border-black/5">
                <h4 className="text-[10px] font-bold text-stone-500 light-theme:text-stone-600 uppercase tracking-widest mb-4">Today's Quick View</h4>
                {todayEvents.length > 0 ? (
                    <div className="space-y-2">
                        {todayEvents.map(e => (
                            <div key={`qv-${e.id}`} className="flex items-center gap-3 p-2 bg-white/5 light-theme:bg-black/5 rounded-xl border border-white/5 light-theme:border-black/5">
                                <div className={`w-1.5 h-1.5 rounded-full ${e.color || 'bg-primary'}`} />
                                <span className="text-xs font-bold text-stone-300 light-theme:text-stone-700 truncate">{e.title}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-stone-600 italic">No events scheduled.</div>
                )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Tab View */}
        <div className="lg:col-span-8">
          <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 light-theme:border-black/5 bg-white/[0.01] light-theme:bg-black/[0.01] min-h-[600px]">
            <div className="flex items-center gap-2 mb-8">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-base font-bold text-stone-400 light-theme:text-stone-600 uppercase tracking-widest">{activeTab} Details</h3>
            </div>

            <div className="space-y-4">
                {activeTab === 'Events' && (
                    filteredEvents.map(e => (
                        <div key={e.id} className="p-5 bg-white/5 light-theme:bg-black/5 border border-white/10 light-theme:border-black/10 rounded-2xl group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${e.color || 'bg-primary'}`} />
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white ${e.color || 'bg-stone-500'}`}>{e.category || 'General'}</span>{e.recurrence && e.recurrence !== 'None' && <Repeat className="w-3 h-3 text-stone-500" />}</div>
                                    <h4 className="text-white light-theme:text-text-light font-bold text-base">{e.title}</h4>
                                    <div className="text-xs text-stone-500 light-theme:text-stone-600 font-bold uppercase tracking-widest flex items-center gap-4">
                                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />{e.start_time} - {e.end_time}</div>
                                        {e.location && <div className="flex items-center gap-1.5 truncate max-w-[200px]"><MapPin className="w-3.5 h-3.5 text-red-500" />{e.location}</div>}
                                    </div>
                                </div>
                                <button onClick={() => onDeleteEvent(e.id)} className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 light-theme:text-stone-700 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))
                )}
                {activeTab === 'Tasks' && (
                    filteredTasks.map(t => (
                        <div key={t.id} className="p-4 bg-white/5 light-theme:bg-black/5 border border-white/10 light-theme:border-black/10 rounded-xl flex items-center justify-between group hover:bg-white/[0.08] light-theme:hover:bg-black/[0.08] transition-all">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onToggleTodo(t.id, t.is_completed)}>{t.is_completed ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-stone-500" />}<div><span className={`text-sm font-medium ${t.is_completed ? 'line-through text-stone-600' : 'text-stone-200 light-theme:text-text-light'}`}>{t.task}</span>{t.time_frame && <div className="text-[10px] text-stone-500 light-theme:text-stone-600 flex items-center gap-1 mt-1 font-bold uppercase"><Clock className="w-2.5 h-2.5" /> {t.time_frame}</div>}</div></div>
                            <button onClick={() => onDeleteTodo(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 light-theme:text-stone-700 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))
                )}
                {activeTab === 'Memories' && (
                    filteredMemories.map(m => (
                        <div key={m.id} className="p-5 bg-white/5 light-theme:bg-black/5 border border-white/10 light-theme:border-black/10 rounded-2xl group transition-all"><div className="flex justify-between items-start mb-4"><h4 className="text-white light-theme:text-text-light font-bold text-base flex items-center gap-2"><History className="w-5 h-5 text-amber-500" />{m.title}</h4><button onClick={() => onDeleteMemory(m.id)} className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 light-theme:text-stone-700 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button></div><p className="text-sm text-stone-500 light-theme:text-stone-600 italic">"{m.description}"</p></div>
                    ))
                )}
                {activeTab === 'Reminders' && (
                    reminders.sort((a,b) => new Date(a.trigger_at).getTime() - new Date(b.trigger_at).getTime()).map(r => (
                        <div key={r.id} className="p-5 bg-white/5 light-theme:bg-black/5 border border-white/10 light-theme:border-black/10 rounded-2xl flex items-center justify-between group hover:bg-white/[0.08] light-theme:hover:bg-black/[0.08] transition-all"><div className="flex items-center gap-4"><div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-inner"><Bell className="w-5 h-5" /></div><div><div className="text-sm font-bold text-white light-theme:text-text-light">{r.title}</div><div className="text-[10px] text-stone-500 light-theme:text-stone-600 uppercase font-black mt-1 flex items-center gap-1.5"><Clock className="w-3 h-3 text-primary" />{format(new Date(r.trigger_at), 'MMM d, h:mm a')}</div></div></div><button onClick={() => onDeleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 light-theme:text-stone-700 hover:text-red-500 transition-all bg-white/5 light-theme:bg-black/5 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>
                    ))
                )}
                {((activeTab === 'Events' && filteredEvents.length === 0) || (activeTab === 'Tasks' && filteredTasks.length === 0) || (activeTab === 'Memories' && filteredMemories.length === 0) || (activeTab === 'Reminders' && reminders.length === 0)) && (
                    <EmptyState text={`No ${activeTab.toLowerCase()} recorded`} icon={<CalendarIcon className="w-8 h-8" />} />
                )}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="absolute inset-0 bg-bg-dark light-theme:bg-bg-light z-50 p-6 flex flex-col overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-bg-dark light-theme:bg-bg-light py-2 z-10"><div><h3 className="text-2xl font-bold text-white light-theme:text-text-light flex items-center gap-2"><Plus className="w-6 h-6 text-primary" />New {activeTab.slice(0, -1)}</h3><p className="text-xs text-stone-500 light-theme:text-stone-600 font-bold uppercase tracking-widest mt-1">Date: {format(selectedDate, 'MMM d, yyyy')}</p></div><button onClick={() => setShowAddModal(false)} className="p-3 bg-white/5 light-theme:bg-black/5 rounded-2xl text-stone-500 light-theme:text-stone-600 hover:text-white light-theme:hover:text-text-light transition-all"><X className="w-6 h-6" /></button></div>
          <div className="space-y-6 pb-10">
            <div className="space-y-2"><label className="text-[10px] font-black text-stone-500 light-theme:text-stone-600 uppercase tracking-[0.2em] ml-1">Title</label><input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Enter details..." className="w-full p-4 glass-input rounded-2xl text-white light-theme:text-text-light text-sm font-medium" /></div>
            {activeTab === 'Tasks' && (<><div className="space-y-2"><label className="text-[10px] font-black text-stone-500 light-theme:text-stone-600 uppercase tracking-[0.2em] ml-1">Time</label><input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-white light-theme:text-text-light text-sm" /></div><div className="space-y-2"><label className="text-[10px] font-black text-stone-500 light-theme:text-stone-600 uppercase tracking-[0.2em] ml-1">Task Details</label><textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Break down the task..." className="w-full p-4 glass-input rounded-2xl text-white light-theme:text-text-light h-24 text-sm resize-none" /></div></>)}
            {activeTab === 'Events' && (<><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-stone-500 light-theme:text-stone-600 uppercase tracking-[0.2em] ml-1">Start Time</label><input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-white light-theme:text-text-light text-sm" /></div><div className="space-y-2"><label className="text-[10px] font-black text-stone-500 light-theme:text-stone-600 uppercase tracking-[0.2em] ml-1">End Time</label><input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-white light-theme:text-text-light text-sm" /></div></div><div className="space-y-2">
    <label className="text-[10px] font-black text-stone-500 light-theme:text-stone-600 uppercase tracking-[0.2em] ml-1">Category</label>
    <CustomDropdown 
        options={categoryOptions} 
        value={newCategory} 
        onChange={setNewCategory}
        buttonClassName="p-4"
    />
</div><div className="space-y-2"><label className="text-[10px] font-black text-stone-500 light-theme:text-stone-600 uppercase tracking-[0.2em] ml-1">Notes</label><textarea value={newExtra} onChange={e => setNewExtra(e.target.value)} placeholder="Details..." className="w-full p-4 glass-input rounded-2xl text-white light-theme:text-text-light h-24 text-sm resize-none" /></div></>)}
            {activeTab === 'Reminders' && (<div className="space-y-2"><label className="text-[10px] font-black text-stone-500 light-theme:text-stone-600 uppercase tracking-[0.2em] ml-1">Trigger Time</label><input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-white light-theme:text-text-light text-sm" /></div>)}
            <button onClick={handleAdd} className="w-full py-5 bg-primary text-white font-bold rounded-2xl hover:bg-secondary transition-all shadow-xl shadow-primary/30 mt-6 active:scale-95">Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavTab({ tab, active, onClick, icon }: { tab: Tab, active: Tab, onClick: (t: Tab) => void, icon: React.ReactNode }) {
    return (
        <button onClick={() => onClick(tab)} className={`nav-item-glass ${active === tab ? 'active' : 'text-stone-400 light-theme:text-stone-500'}`}>{icon}<span className="text-[10px] font-bold uppercase tracking-widest">{tab}</span></button>
    );
}

function EmptyState({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (<div className="flex flex-col items-center justify-center py-20 text-stone-700 light-theme:text-stone-400 bg-white/[0.01] light-theme:bg-black/[0.01] rounded-3xl border border-dashed border-white/5 light-theme:border-black/5"><div className="mb-4 opacity-10">{icon}</div><p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">{text}</p></div>);
}
