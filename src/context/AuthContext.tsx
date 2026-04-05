import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  access: (username: string, action: 'login' | 'register') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`);
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (err) {
        // Not logged in is fine
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const access = async (username: string, action: 'login' | 'register'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action }),
      });
      
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        return { success: false, error: `Server error (${res.status}): ${text.slice(0, 100)}` };
      }

      if (res.ok) {
        setUser({ id: data.id, username: data.username });
        return { success: true };
      }
      return { success: false, error: data.error || 'Access failed' };
    } catch (err) {
      console.error("Access failed:", err);
      return { success: false, error: "Connection error. Make sure the server is running." };
    }
  };

  const login = async (email: string, password: string) => { return false; }; // Legacy stub
  const register = async (email: string, password: string, name?: string) => { return false; }; // Legacy stub

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, access, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
