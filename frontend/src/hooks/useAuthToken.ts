import { useState, useCallback } from 'react';
import type { User } from '../types';
import { logoutUser } from '../services/api';

interface AuthState {
  token: string | null;
  user: User | null;
}

function loadFromStorage(): AuthState {
  try {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? (JSON.parse(userRaw) as User) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function useAuthToken() {
  const [auth, setAuth] = useState<AuthState>(loadFromStorage);

  const setSession = useCallback((token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuth({ token, user });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ token: null, user: null });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // best-effort: clear local state regardless
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setAuth((prev) => {
      if (!prev.user) return prev;
      const updated = { ...prev.user, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return { ...prev, user: updated };
    });
  }, []);

  return {
    token: auth.token,
    user: auth.user,
    isAuthenticated: !!auth.token,
    isAdmin: auth.user?.role === 'admin',
    setSession,
    clearSession,
    logout,
    updateUser,
  };
}
