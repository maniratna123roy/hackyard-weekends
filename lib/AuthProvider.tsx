'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'participant' | 'founder' | 'admin';
  avatarUrl?: string | null;
  college?: string | null;
  bio?: string | null;
  skills?: string[];
  links?: Record<string, string>;
  preferences?: Record<string, any>;
  emailVerified: boolean;
  onboardingDone: boolean;
}

export interface Startup {
  id: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  stage?: string | null;
  description?: string | null;
  status: string;
}

interface AuthContextType {
  user: User | null;
  startup: Startup | null;
  loading: boolean;
  login: (email: string, options?: { name?: string; role?: 'participant' | 'founder'; adminAccessCode?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  startup: null,
  loading: true,
  login: async () => { throw new Error('Not initialized'); },
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiFetch<{ user: User; startup?: Startup | null }>('/api/v1/auth/me');
      setUser(data.user);
      setStartup(data.startup || null);
    } catch {
      setUser(null);
      setStartup(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (
    email: string,
    options?: { name?: string; role?: 'participant' | 'founder'; adminAccessCode?: string }
  ) => {
    const data = await apiFetch<{ user: User; startup?: Startup | null }>('/api/v1/auth/session', {
      method: 'POST',
      body: JSON.stringify({ email, ...options }),
    });
    setUser(data.user);
    setStartup(data.startup || null);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setStartup(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, startup, loading, login, logout, refresh: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
