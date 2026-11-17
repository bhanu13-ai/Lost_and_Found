import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearStoredSession, getStoredToken, getStoredUser, setStoredSession } from '../lib/api';
import type { PortalUser, UserRole } from '../types/portal';

interface AuthContextValue {
  user: PortalUser | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<PortalUser>;
  register: (payload: {
    fullName: string;
    email: string;
    studentId: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    department?: string;
  }) => Promise<PortalUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api.auth
      .me()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        clearStoredSession();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    const res = await api.auth.login({ email, password, rememberMe });
    setStoredSession(res.token, res.user, rememberMe);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      studentId: string;
      password: string;
      confirmPassword: string;
      role: UserRole;
      department?: string;
    }) => {
      const res = await api.auth.register(payload);
      setStoredSession(res.token, res.user, true);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
