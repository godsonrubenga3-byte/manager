import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-bg-dark to-bg-dark">
      <div className="max-w-md w-full space-y-8">
        <div>
            <div className="mx-auto h-20 w-20 bg-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/30 mb-8">
              <LogIn className="h-10 w-10 text-white" />
            </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to your account to continue managing your finances
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
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass pl-12 pr-4 py-4 border border-transparent rounded-2xl w-full text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/5 backdrop-blur-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass pl-12 pr-12 py-4 border border-transparent rounded-2xl w-full text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/5 backdrop-blur-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-slate-500" /> : <Eye className="h-5 w-5 text-slate-500" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-slate-300/20 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Forgot your password?
              </a>
            </div>
          </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-bold rounded-2xl text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-primary/50 focus:ring-offset-0 disabled:opacity-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-primary/25 flex items-center gap-2"
            >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                Sign in
              </>
            )}
          </button>

          <div className="text-center">
            <Link to="/register" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              Don't have an account? <span className="text-primary">Create one now</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

