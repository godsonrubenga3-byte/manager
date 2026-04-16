import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';
import { db, initRemoteDB } from '../services/db';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  access: (username: string, action: 'login' | 'register') => Promise<{ success: boolean; error?: string }>;
  syncAuth: (username: string, action: 'login' | 'register') => Promise<{ success: boolean; error?: string }>;
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
    initRemoteDB(); // Ensure tables are ready on Turso
  }, []);

  const access = async (username: string, action: 'login' | 'register'): Promise<{ success: boolean; error?: string }> => {
    try {
      // Instant local profile creation - no blocking on server fetch
      const newUser = { id: username, username };
      await Preferences.set({ key: 'manager_user', value: JSON.stringify(newUser) });
      setUser(newUser);
      return { success: true };
    } catch (err) {
      console.error("Local access failed:", err);
      return { success: false, error: "Failed to create local profile." };
    }
  };

  const syncAuth = async (username: string, action: 'login' | 'register'): Promise<{ success: boolean; error?: string }> => {
    try {
      if (action === 'register') {
        // Attempt to create user in Turso
        try {
          await db.execute({
            sql: "INSERT INTO users (username) VALUES (?)",
            args: [username]
          });
        } catch (err: any) {
          if (!err.message?.includes('UNIQUE')) {
            throw err;
          }
          // If already exists, just continue to login logic
        }
      }

      // Find user in Turso
      const result = await db.execute({
        sql: "SELECT * FROM users WHERE username = ?",
        args: [username]
      });

      if (result.rows.length > 0) {
        const remoteUser = result.rows[0];
        const newUser = { id: remoteUser.id.toString(), username: remoteUser.username as string };
        await Preferences.set({ key: 'manager_user', value: JSON.stringify(newUser) });
        setUser(newUser);
        return { success: true };
      } else {
        return { success: false, error: "User not found in remote database." };
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
      return { success: false, error: err.message || "Database connection error." };
    }
  };

  const logout = async () => {
    try {
      await Preferences.remove({ key: 'manager_user' });
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, access, syncAuth, logout, loading }}>
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
