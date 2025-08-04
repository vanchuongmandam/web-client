// src/context/AuthContext.tsx
"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// --- Định nghĩa kiểu dữ liệu ---
interface User {
  _id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>; // Thêm hàm register
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void; // Thêm hàm để xóa lỗi
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

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse auth data from localStorage", e);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  // --- Hàm Đăng nhập ---
  const login = async (username: string, password: string) => {
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
    } catch (err: any) {
      setError(err.message);
      throw err; // Ném lỗi ra để component có thể bắt
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- Hàm Đăng ký ---
  const register = async (username: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          const response = await fetch(`${apiBaseUrl}/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, role: 'user' }), // Mặc định role là user
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Đăng ký thất bại.');

          // Đăng ký thành công, tự động đăng nhập luôn
          await login(username, password);

      } catch (err: any) {
          setError(err.message);
          throw err; // Ném lỗi ra để component có thể bắt
      } finally {
          setIsLoading(false);
      }
  };

  // --- Hàm Đăng xuất ---
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, error, clearError }}>
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
