'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Customer = {
  id: string;
  method: 'email' | 'google' | 'phone';
  email?: string;
  phone?: string;
  name: string;
  photo?: string;
  address?: string;
};

type LoginPayload = { mode: 'login' | 'register'; method: 'email' | 'google' | 'phone'; email?: string; phone?: string; password?: string; name?: string };

type AuthContextValue = {
  user: Customer | null;
  isLoginOpen: boolean;
  authStatus: string;
  openLogin: () => void;
  closeLogin: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  updateProfile: (profile: Partial<Customer>) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const storageKey = 'chitratech-customer';

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setUser(JSON.parse(saved) as Customer);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const saveUser = (next: Customer) => {
    setUser(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const login = useCallback(async (payload: LoginPayload) => {
    setAuthStatus('Please wait...');
    const response = await fetch('/api/customer/account', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) {
      setAuthStatus(data.error || 'Login failed.');
      return;
    }
    saveUser(data.user as Customer);
    setAuthStatus('');
    setIsLoginOpen(false);
  }, []);

  const updateProfile = useCallback(async (profile: Partial<Customer>) => {
    if (!user) return;
    setAuthStatus('Saving profile...');
    const response = await fetch('/api/customer/account', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...profile, id: user.id }) });
    const data = await response.json();
    if (!response.ok) {
      setAuthStatus(data.error || 'Profile update failed.');
      return;
    }
    saveUser(data.user as Customer);
    setAuthStatus('Profile saved.');
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(storageKey);
  }, []);

  const value = useMemo(() => ({ user, isLoginOpen, authStatus, openLogin: () => setIsLoginOpen(true), closeLogin: () => setIsLoginOpen(false), login, updateProfile, logout }), [authStatus, isLoginOpen, login, logout, updateProfile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider');
  return context;
}
