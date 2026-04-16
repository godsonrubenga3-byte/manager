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
  FileText
} from 'lucide-react';
import { format, isToday, isPast, isSameDay, addDays, subDays } from 'date-fns';

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
  trigger_at: string; // ISO string
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

  // Form states
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
    
    if (activeTab === 'Tasks') {
      onAddTodo(newTitle, newTime, newDescription);
    } else if (activeTab === 'Events') {
      onAddEvent({ 
        title: newTitle, 
        date: dateStr, 
        is_all_day: !newTime && !newEndTime, 
        description: newExtra,
        start_time: newTime || '00:00',
        end_time: newEndTime || '23:59',
        songs_of_the_day: newSongs,
        location: newLocation,
        category: newCategory,
        color: CATEGORIES.find(c => c.name === newCategory)?.color || 'bg-stone-500',
        reminder_timing: newReminderTiming,
        recurrence: newRecurrence
      });
    } else if (activeTab === 'Memories') {
      onAddMemory({ title: newTitle, date: dateStr, favorite_song: newSongs, spotify_link: newExtra, description: newTitle });
    } else if (activeTab === 'Reminders') {
      const triggerDate = new Date(selectedDate);
      if (newTime) {
        const [hours, minutes] = newTime.split(':').map(Number);
        triggerDate.setHours(hours, minutes, 0, 0);
      }
      onAddReminder({ title: newTitle, trigger_at: triggerDate.toISOString() });
    }
    
    setNewTitle('');
    setNewTime('');
    setNewEndTime('');
    setNewExtra('');
    setNewSongs('');
    setNewLocation('');
    setNewCategory(CATEGORIES[0].name);
    setNewReminderTiming(REMINDER_OPTIONS[0].value);
    setNewRecurrence(RECURRENCE_OPTIONS[0]);
    setNewDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="glass rounded-3xl border border-white/5 flex flex-col overflow-hidden h-full bg-white/[0.01]">
      {/* Header with Today's Date */}
      <div className="p-6 border-b border-white/5 bg-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl text-primary">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{format(new Date(), 'MMMM do, yyyy')}</h2>
              <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">Today's Overview</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-primary text-white rounded-xl hover:bg-secondary transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Quick view of today's events */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {todayEvents.length > 0 ? todayEvents.map(e => (
            <div key={e.id} className={`flex-shrink-0 px-3 py-1.5 ${e.color || 'bg-white/5'} border border-white/10 rounded-full text-[10px] font-bold text-white flex items-center gap-2 shadow-sm`}>
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              {e.title}
            </div>
          )) : (
            <div className="text-xs text-stone-600 italic">No events today.</div>
          )}
        </div>
      </div>

      {/* Date Selector - Flexible & Stretchy */}
      <div className="px-4 sm:px-6 py-4 flex items-center gap-4 bg-white/[0.02] border-b border-white/5 relative">
        <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-2 hover:bg-white/5 rounded-xl text-stone-500 transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 flex justify-center min-w-0">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 w-full justify-center group hover:border-primary/30 transition-all cursor-pointer overflow-hidden">
            <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-bold text-white uppercase tracking-widest truncate">
              {format(selectedDate, 'EEEE, MMM d')}
            </span>
          </div>
        </div>

        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-white/5 rounded-xl text-stone-500 transition-colors shrink-0">
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Floating Date Badge (Shows chosen date context) */}
        {!isToday(selectedDate) && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/30 animate-in fade-in slide-in-from-top-2 duration-300">
            {isPast(selectedDate) ? 'Past Date' : 'Upcoming'}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {activeTab === 'Events' && (
          <div className="space-y-4">
            {filteredEvents.map(e => (
              <div key={e.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl group relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${e.color || 'bg-primary'}`} />
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white ${e.color || 'bg-stone-500'}`}>{e.category || 'General'}</span>
                        {e.recurrence && e.recurrence !== 'None' && <Repeat className="w-3 h-3 text-stone-500" />}
                    </div>
                    <h4 className="text-white font-bold text-base">{e.title}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <div className="text-xs text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {e.start_time} - {e.end_time}
                      </div>
                      {e.location && (
                        <div className="text-xs text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1.5 truncate max-w-[150px]">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {e.location}
                        </div>
                      )}
                    </div>
                    {e.songs_of_the_day && (
                      <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase bg-primary/5 w-fit px-2 py-1 rounded-md">
                        <Music className="w-3 h-3" />
                        {e.songs_of_the_day}
                      </div>
                    )}
                    {e.description && <p className="text-xs text-stone-500 mt-2 leading-relaxed">{e.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => onDeleteEvent(e.id)} className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-500 transition-all bg-white/5 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {e.reminder_timing !== 'none' && <Bell className="w-3.5 h-3.5 text-amber-500 animate-pulse" />}
                  </div>
                </div>
              </div>
            ))}
            {filteredEvents.length === 0 && <EmptyState text="No events for this day" icon={<CalendarIcon className="w-8 h-8" />} />}
          </div>
        )}

        {activeTab === 'Tasks' && (
          <div className="space-y-3">
            {filteredTasks.map(t => (
              <div key={t.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onToggleTodo(t.id, t.is_completed)}>
                  {t.is_completed ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-stone-500" />}
                  <div>
                    <span className={`text-sm font-medium ${t.is_completed ? 'line-through text-stone-600' : 'text-stone-200'}`}>{t.task}</span>
                    {t.description && <p className="text-xs text-stone-500 mt-1">{t.description}</p>}
                    {t.time_frame && <div className="text-[10px] text-stone-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-widest"><Clock className="w-2.5 h-2.5" /> {t.time_frame}</div>}
                  </div>
                </div>
                <button onClick={() => onDeleteTodo(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {filteredTasks.length === 0 && <EmptyState text="No tasks for this day" icon={<CheckSquare className="w-8 h-8" />} />}
          </div>
        )}

        {activeTab === 'Memories' && (
          <div className="space-y-4">
            {filteredMemories.map(m => (
              <div key={m.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl group hover:border-amber-500/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-white font-bold text-base flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-500" />
                    {m.title}
                  </h4>
                  <button onClick={() => onDeleteMemory(m.id)} className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {m.description && <p className="text-sm text-stone-500 mb-4 leading-relaxed italic">"{m.description}"</p>}
                {(m.favorite_song || m.songs_of_the_day) && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Music className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-xs text-stone-300 font-bold truncate max-w-[200px] uppercase tracking-wider">{m.songs_of_the_day || m.favorite_song}</div>
                    </div>
                    {m.spotify_link && (
                      <a href={m.spotify_link} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all shadow-lg shadow-emerald-500/10">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filteredMemories.length === 0 && <EmptyState text="No memories recorded" icon={<History className="w-8 h-8" />} />}
          </div>
        )}

        {activeTab === 'Reminders' && (
          <div className="space-y-3">
            {reminders.sort((a,b) => new Date(a.trigger_at).getTime() - new Date(b.trigger_at).getTime()).map(r => (
              <div key={r.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-inner">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{r.title}</div>
                    <div className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-black mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-primary" />
                      {format(new Date(r.trigger_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
                <button onClick={() => onDeleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-500 transition-all bg-white/5 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {reminders.length === 0 && <EmptyState text="No upcoming reminders" icon={<Bell className="w-8 h-8" />} />}
          </div>
        )}
      </div>

      {/* Bottom Nav Bar */}
      <div className="grid grid-cols-4 border-t border-white/5 bg-white/5">
        <NavTab icon={<CalendarIcon className="w-4 h-4" />} label="Events" active={activeTab === 'Events'} onClick={() => setActiveTab('Events')} />
        <NavTab icon={<History className="w-4 h-4" />} label="Memories" active={activeTab === 'Memories'} onClick={() => setActiveTab('Memories')} />
        <NavTab icon={<Bell className="w-4 h-4" />} label="Reminders" active={activeTab === 'Reminders'} onClick={() => setActiveTab('Reminders')} />
        <NavTab icon={<CheckSquare className="w-4 h-4" />} label="Tasks" active={activeTab === 'Tasks'} onClick={() => setActiveTab('Tasks')} />
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-bg-dark/98 z-50 p-6 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-bg-dark/98 py-2 z-10">
            <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Plus className="w-6 h-6 text-primary" />
                    New {activeTab.slice(0, -1)}
                </h3>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-1">Date: {format(selectedDate, 'MMM d, yyyy')}</p>
            </div>
            <button onClick={() => setShowAddModal(false)} className="p-3 bg-white/5 rounded-2xl text-stone-500 hover:text-white transition-all"><Plus className="w-6 h-6 rotate-45" /></button>
          </div>
          
          <div className="space-y-6 pb-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Title / Label</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={activeTab === 'Tasks' ? "Task name..." : "What's happening?"}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
              />
            </div>

            {activeTab === 'Tasks' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Reminder Time</label>
                  <input 
                    type="time" 
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Task Details</label>
                  <textarea 
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Break down the task..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 h-24 text-sm resize-none"
                  />
                </div>
              </>
            )}

            {activeTab === 'Reminders' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Trigger Time</label>
                <input 
                  type="time" 
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
            )}

            {activeTab === 'Memories' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Song Title</label>
                  <input 
                    type="text" 
                    value={newSongs}
                    onChange={e => setNewSongs(e.target.value)}
                    placeholder="Soundtrack for this memory..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Spotify Link</label>
                  <input 
                    type="text" 
                    value={newExtra}
                    onChange={e => setNewExtra(e.target.value)}
                    placeholder="https://open.spotify.com/..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
              </>
            )}

            {activeTab === 'Events' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Category</label>
                        <select 
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none"
                        >
                            {CATEGORIES.map(c => <option key={c.name} value={c.name} className="bg-card-dark">{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Recurrence</label>
                        <select 
                            value={newRecurrence}
                            onChange={e => setNewRecurrence(e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none"
                        >
                            {RECURRENCE_OPTIONS.map(o => <option key={o} value={o} className="bg-card-dark">{o}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Start Time</label>
                    <input 
                      type="time" 
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">End Time</label>
                    <input 
                      type="time" 
                      value={newEndTime}
                      onChange={e => setNewEndTime(e.target.value)}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Location / Link</label>
                  <input 
                    type="text" 
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    placeholder="Physical address or Zoom link..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Reminder Timing</label>
                  <select 
                    value={newReminderTiming}
                    onChange={e => setNewReminderTiming(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none"
                  >
                    {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-card-dark">{o.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Song(s) of the Day</label>
                  <input 
                    type="text" 
                    value={newSongs}
                    onChange={e => setNewSongs(e.target.value)}
                    placeholder="Theme songs for this event..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Description</label>
                  <textarea 
                    value={newExtra}
                    onChange={e => setNewExtra(e.target.value)}
                    placeholder="Details about the event..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 h-24 text-sm resize-none"
                  />
                </div>
              </>
            )}

            <button 
              onClick={handleAdd}
              className="w-full py-5 bg-primary text-white font-bold rounded-2xl hover:bg-secondary transition-all shadow-xl shadow-primary/30 mt-6 text-lg active:scale-95"
            >
              Confirm {activeTab.slice(0, -1)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-4 transition-all ${active ? 'text-primary bg-white/[0.03] shadow-inner' : 'text-stone-600 hover:text-stone-300'}`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase mt-1.5 tracking-tighter">{label}</span>
    </button>
  );
}
function EmptyState({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-stone-700 bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
      <div className="mb-4 opacity-10">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">{text}</p>
    </div>
  );
}
