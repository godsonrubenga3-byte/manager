import React, { useState, useEffect } from 'react';
import { CheckSquare, Circle, Trash2, Plus } from 'lucide-react';

interface Todo {
  id: number;
  task: string;
  is_completed: number;
}

interface TaskManagerProps {
  todos: Todo[];
  onAdd: (task: string) => void;
  onToggle: (id: number, currentStatus: number) => void;
  onDelete: (id: number) => void;
}

export default function TaskManager({ todos, onAdd, onToggle, onDelete }: TaskManagerProps) {
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAdd(newTask.trim());
    setNewTask('');
  };

  return (
    <div className="glass p-6 rounded-3xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            To-Do List
          </h2>
          <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-1">Daily Tasks & Reminders</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative mb-6">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/30 outline-none text-white text-sm"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary/20 text-primary hover:bg-primary/40 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {todos.length === 0 ? (
          <div className="text-center py-10 text-stone-600 italic border-2 border-dashed border-white/5 rounded-2xl text-sm">
            No pending tasks. You're all caught up!
          </div>
        ) : (
          todos.map((todo) => (
            <div 
              key={todo.id} 
              className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${
                todo.is_completed ? 'bg-white/5 border-transparent opacity-50' : 'bg-white/10 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onToggle(todo.id, todo.is_completed)}>
                {todo.is_completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-stone-400 group-hover:text-primary transition-colors" />
                )}
                <span className={`text-sm ${todo.is_completed ? 'text-stone-400 line-through' : 'text-stone-200'}`}>
                  {todo.task}
                </span>
              </div>
              <button 
                onClick={() => onDelete(todo.id)}
                className="p-1.5 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
