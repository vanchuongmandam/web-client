// src/context/AuthContext.tsx
"use client";

import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, register as apiRegister } from '@/lib/api';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

interface User {
  _id: string;
  username: string;
  role: string;
  isOAuth?: boolean;
  balance?: number;
  bookmarkedDocuments?: any[];
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
  loginWithGoogle: () => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
  isHydrated: boolean;
  isOAuth: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOAuth, setIsOAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setIsOAuth(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    
    if (session) {
      await nextAuthSignOut({ redirect: false });
    }
    
    router.push('/login');
  }, [router, session]);

  // Sync with NextAuth session
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      logout();
      return;
    }
    if (sessionStatus === "authenticated" && session?.backendToken && session?.user) {
      setToken(session.backendToken);
      setIsOAuth(true);
      localStorage.setItem('authToken', session.backendToken);
      document.cookie = `authToken=${session.backendToken}; path=/; max-age=604800; SameSite=Lax`;
      
      setUser((prev) => {
        const merged = { ...session.user, ...prev } as User;
        // Explicitly preserve balance if present in previous state
        if (prev && prev.balance !== undefined) {
          merged.balance = prev.balance;
        }
        localStorage.setItem('authUser', JSON.stringify(merged));
        return merged;
      });
    } else if (sessionStatus === "unauthenticated") {
      // Only check localStorage if not logged in via NextAuth
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
              const parsedUser = JSON.parse(storedUser);
              setUser((prev) => {
                const merged = { ...parsedUser, ...prev } as User;
                if (prev && prev.balance !== undefined) {
                  merged.balance = prev.balance;
                }
                return merged;
              });
            }
          }
        } catch (e) {
          console.error("Invalid token:", e);
          logout();
        }
      }
    }
    
    if (sessionStatus !== "loading") {
      setIsLoading(false);
      setIsHydrated(true);
    }
  }, [session, sessionStatus, logout]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const { getProfile } = await import('@/lib/api');
      const profile = await getProfile(token);
      setUser((prev) => {
        const baseUser = prev || {
          _id: profile._id,
          username: profile.username,
          role: profile.role,
        };
        const updatedUser = {
          ...baseUser,
          balance: profile.balance,
          avatar: profile.avatar,
          displayName: profile.displayName,
          email: profile.email,
        };
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        return updatedUser;
      });
    } catch (e: any) {
      console.error("Failed to refresh profile:", e);
      if (
        e?.status === 401 ||
        e?.status === 403 ||
        (e instanceof Error && (
          e.message.includes('401') ||
          e.message.includes('403') ||
          e.message.includes('Unauthorized') ||
          e.message.includes('expired') ||
          e.message.includes('disabled') ||
          e.message.includes('Invalid')
        ))
      ) {
        logout();
      }
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token, refreshProfile]);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiLogin(username, password);
      setToken(data.token);
      setUser(data.user);
      setIsOAuth(false);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      document.cookie = `authToken=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); }
      else { setError("Đã có lỗi không xác định xảy ra"); }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await nextAuthSignIn('google');
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); }
      else { setError("Đã có lỗi không xác định xảy ra"); }
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, password: string, email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiRegister(username, password, email);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); }
      else { setError("Đã có lỗi không xác định xảy ra"); }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshProfile,
    isLoading,
    isHydrated,
    isOAuth,
    error,
    clearError
  }), [user, token, isLoading, isHydrated, isOAuth, error, logout, login, loginWithGoogle, register, clearError, refreshProfile]);

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
