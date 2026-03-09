// src/context/AuthContext.tsx
"use client";

import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, register as apiRegister } from '@/lib/api';

interface User {
  _id: string;
  username: string;
  role: string;
}

interface DecodedToken {
  user: {
    id: string;
    role: string;
  };
  iat: number;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        const decoded: DecodedToken = jwtDecode(storedToken);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setToken(storedToken);
          const storedUser = localStorage.getItem('authUser');
          if (storedUser && storedUser !== 'undefined') {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (e) {
        console.error("Invalid token:", e);
        logout();
      }
    }
    setIsLoading(false);
    setIsHydrated(true);
  }, [logout]);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiLogin(username, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); }
      else { setError("Đã có lỗi không xác định xảy ra"); }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const register = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiRegister(username, password);
      await login(username, password);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); }
      else { setError("Đã có lỗi không xác định xảy ra"); }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const value = useMemo(() => ({
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isHydrated,
    error,
    clearError
  }), [user, token, isLoading, isHydrated, error, logout, login, register, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
