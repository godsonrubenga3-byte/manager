import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { access } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await access(username, 'login');
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Access denied');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-bg-dark to-bg-dark">
      <div className="max-w-md w-full space-y-8">
        <div>
            <div className="mx-auto h-20 w-20 bg-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/30 mb-8">
              <Lock className="h-10 w-10 text-white" />
            </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">Local Profile</h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Create or access your offline profile instantly.
          </p>
        </div>
        <form className="mt-8 space-y-6 glass p-10 rounded-3xl backdrop-blur-xl shadow-2xl border border-white/10" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Profile Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass pl-12 pr-4 py-4 border border-transparent rounded-2xl w-full text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/5 backdrop-blur-sm"
                  placeholder="Enter profile name"
                />
              </div>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="group relative flex justify-center py-4 px-6 border border-transparent text-sm font-bold rounded-2xl text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-primary/50 focus:ring-offset-0 disabled:opacity-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-primary/25 items-center gap-2"
              >
                {loading ? '...' : 'Access Profile'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!username.trim()) { setError('Enter a profile name'); return; }
                  setLoading(true);
                  const res = await access(username, 'register');
                  setLoading(false);
                  if (res.success) navigate('/dashboard');
                  else setError(res.error || 'Profile creation failed');
                }}
                disabled={loading}
                className="group relative flex justify-center py-4 px-6 border border-white/10 text-sm font-bold rounded-2xl text-stone-300 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/50 focus:ring-offset-0 disabled:opacity-50 transition-all duration-200 items-center gap-2"
              >
                {loading ? '...' : 'Create Profile'}
              </button>
            </div>

          <div className="text-center text-xs text-stone-500 mt-4 px-4 leading-relaxed">
            Data is stored locally on this device. You can <span className="text-primary font-bold">Sync</span> with the cloud later in the dashboard.
          </div>
        </form>
      </div>
    </div>
  );
}

