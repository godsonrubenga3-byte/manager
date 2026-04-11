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
  Circle
} from 'lucide-react';
import { format, isToday, isPast, isFuture, addDays, subDays, isSameDay } from 'date-fns';

interface Task {
  id: number;
  task: string;
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
  onAddTodo: (task: string, timeFrame?: string) => void;
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
  const [newExtra, setNewExtra] = useState(''); // spotify link or description
  const [newSongs, setNewSongs] = useState('');

  const filteredEvents = useMemo(() => events.filter(e => isSameDay(new Date(e.date), selectedDate)), [events, selectedDate]);
  const filteredTasks = useMemo(() => todos.filter(t => t.created_at && isSameDay(new Date(t.created_at), selectedDate)), [todos, selectedDate]);
  const filteredMemories = useMemo(() => memories.filter(m => isSameDay(new Date(m.date), selectedDate)), [memories, selectedDate]);
  
  const todayEvents = useMemo(() => events.filter(e => isToday(new Date(e.date))), [events]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    
    const dateStr = selectedDate.toISOString();
    
    if (activeTab === 'Tasks') {
      onAddTodo(newTitle, newTime);
    } else if (activeTab === 'Events') {
      onAddEvent({ 
        title: newTitle, 
        date: dateStr, 
        is_all_day: !newTime && !newEndTime, 
        description: newExtra,
        start_time: newTime || '00:00',
        end_time: newEndTime || '23:59',
        songs_of_the_day: newSongs
      });
    } else if (activeTab === 'Memories') {
      onAddMemory({ title: newTitle, date: dateStr, favorite_song: newTime, spotify_link: newExtra });
    } else if (activeTab === 'Reminders') {
      const triggerDate = new Date(selectedDate);
      // Simple parse of "X days before" or similar? For now just same day at specific hour
      onAddReminder({ title: newTitle, trigger_at: dateStr });
    }
    
    setNewTitle('');
    setNewTime('');
    setNewEndTime('');
    setNewExtra('');
    setNewSongs('');
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
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Today's Overview</p>
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
            <div key={e.id} className="flex-shrink-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-stone-300 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {e.title}
            </div>
          )) : (
            <div className="text-[10px] text-stone-600 italic">No events today.</div>
          )}
        </div>
      </div>

      {/* Date Selector */}
      <div className="px-6 py-4 flex items-center justify-between bg-white/[0.02] border-b border-white/5">
        <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-1 hover:bg-white/5 rounded-lg text-stone-500"><ChevronLeft className="w-5 h-5" /></button>
        <span className="text-sm font-bold text-white">{format(selectedDate, 'EEE, MMM d')}</span>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-1 hover:bg-white/5 rounded-lg text-stone-500"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {activeTab === 'Events' && (
          <div className="space-y-3">
            {filteredEvents.map(e => (
              <div key={e.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl group relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-bold text-sm">{e.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {e.start_time} - {e.end_time}
                      </div>
                    </div>
                    {e.songs_of_the_day && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-primary font-bold uppercase">
                        <Music className="w-3 h-3" />
                        {e.songs_of_the_day}
                      </div>
                    )}
                    {e.description && <p className="text-xs text-stone-500 mt-2">{e.description}</p>}
                  </div>
                  <button onClick={() => onDeleteEvent(e.id)} className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {isPast(new Date(e.date)) && !isToday(new Date(e.date)) && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                    <History className="w-3 h-3" />
                    Passed (Memory Candidate)
                  </div>
                )}
              </div>
            ))}
            {filteredEvents.length === 0 && <EmptyState text="No events for this day" icon={<CalendarIcon className="w-8 h-8" />} />}
          </div>
        )}

        {activeTab === 'Tasks' && (
          <div className="space-y-3">
            {filteredTasks.map(t => (
              <div key={t.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onToggleTodo(t.id, t.is_completed)}>
                  {t.is_completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-stone-500" />}
                  <div>
                    <span className={`text-sm ${t.is_completed ? 'line-through text-stone-500' : 'text-stone-200'}`}>{t.task}</span>
                    {t.time_frame && <div className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5"><Clock className="w-2.5 h-2.5" /> {t.time_frame}</div>}
                  </div>
                </div>
                <button onClick={() => onDeleteTodo(t.id)} className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-red-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {filteredTasks.length === 0 && <EmptyState text="No tasks for this day" icon={<CheckSquare className="w-8 h-8" />} />}
          </div>
        )}

        {activeTab === 'Memories' && (
          <div className="space-y-3">
            {filteredMemories.map(m => (
              <div key={m.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl group">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-500" />
                    {m.title}
                  </h4>
                  <button onClick={() => onDeleteMemory(m.id)} className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {m.description && <p className="text-xs text-stone-500 mb-3">{m.description}</p>}
                {(m.favorite_song || m.songs_of_the_day) && (
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-primary" />
                      <div className="text-xs text-stone-300 font-medium truncate max-w-[150px]">{m.songs_of_the_day || m.favorite_song}</div>
                    </div>
                    {m.spotify_link && (
                      <a href={m.spotify_link} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md hover:bg-emerald-500/20 transition-all">
                        <ExternalLink className="w-3 h-3" />
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
            {reminders.map(r => (
              <div key={r.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{r.title}</div>
                    <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-0.5">
                      {format(new Date(r.trigger_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
                <button onClick={() => onDeleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-red-500 transition-all">
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

      {/* Add Modal (Simple overlay for now) */}
      {showAddModal && (
        <div className="absolute inset-0 bg-bg-dark/95 z-20 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Add {activeTab}</h3>
            <button onClick={() => setShowAddModal(false)} className="p-2 text-stone-500 hover:text-white"><Plus className="w-6 h-6 rotate-45" /></button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                {activeTab === 'Tasks' ? 'Task List (Describe your tasks)' : 'Title / Task'}
              </label>
              {activeTab === 'Tasks' ? (
                <textarea 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Enter task list..."
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 h-32"
                />
              ) : (
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="What is it?"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}
            </div>

            {activeTab === 'Tasks' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Expected Execution Time</label>
                <input 
                  type="text" 
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  placeholder="e.g. 2:00 PM"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            {activeTab === 'Memories' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Favorite Song</label>
                  <input 
                    type="text" 
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    placeholder="Song title..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Spotify Link</label>
                  <input 
                    type="text" 
                    value={newExtra}
                    onChange={e => setNewExtra(e.target.value)}
                    placeholder="https://open.spotify.com/..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </>
            )}

            {activeTab === 'Events' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Start Time</label>
                    <input 
                      type="time" 
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">End Time</label>
                    <input 
                      type="time" 
                      value={newEndTime}
                      onChange={e => setNewEndTime(e.target.value)}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Song(s) of the Day</label>
                  <input 
                    type="text" 
                    value={newSongs}
                    onChange={e => setNewSongs(e.target.value)}
                    placeholder="Song names..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    value={newExtra}
                    onChange={e => setNewExtra(e.target.value)}
                    placeholder="Details..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 h-24"
                  />
                </div>
              </>
            )}

            <button 
              onClick={handleAdd}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-secondary transition-all shadow-xl shadow-primary/20 mt-4"
            >
              Add to {activeTab}
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
      className={`flex flex-col items-center justify-center py-3 transition-all ${active ? 'text-primary bg-white/5' : 'text-stone-500 hover:text-stone-300'}`}
    >
      {icon}
      <span className="text-[8px] font-bold uppercase mt-1">{label}</span>
    </button>
  );
}

function EmptyState({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-stone-600 italic">
      <div className="mb-4 opacity-20">{icon}</div>
      <p className="text-xs">{text}</p>
    </div>
  );
}
