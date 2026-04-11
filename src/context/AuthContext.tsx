import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';

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
        const { value } = await Preferences.get({ key: 'manager_user' });
        if (value) {
          setUser(JSON.parse(value));
        }
      } catch (err) {
        console.error("Failed to load user from preferences", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const access = async (username: string, action: 'login' | 'register'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action })
      });

      const result = await response.json();

      if (response.ok) {
        const newUser = { id: result.id.toString(), username: result.username };
        await Preferences.set({ key: 'manager_user', value: JSON.stringify(newUser) });
        setUser(newUser);
        return { success: true };
      } else {
        return { success: false, error: result.error || "Access failed" };
      }
    } catch (err) {
      console.error("Access failed:", err);
      return { success: false, error: "Server connection error." };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await Preferences.remove({ key: 'manager_user' });
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
