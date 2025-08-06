// src/context/AuthContext.tsx
"use client";

import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

// --- Định nghĩa kiểu dữ liệu ---
interface User {
  _id: string;
  username: string;
  role: string;
}

interface DecodedToken {
  id: string;
  username: string;
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
  error: string | null;
  clearError: () => void;
}

// --- Tạo Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Tạo Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const decodedToken: DecodedToken = jwtDecode(storedToken);
        if (decodedToken.exp * 1000 < Date.now()) {
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
  }, [logout]);

  const clearError = () => setError(null);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Đăng nhập thất bại.');
      
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
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          const response = await fetch(`${apiBaseUrl}/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, role: 'user' }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Đăng ký thất bại.');
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
    error,
    clearError
  }), [user, token, isLoading, error, logout, login, register]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Tạo Custom Hook để sử dụng Context dễ dàng hơn ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
