// src/context/AuthContext.tsx
"use client";

import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, register as apiRegister } from '@/lib/api';
import { ApiError, toErrorMessage } from '@/lib/errors';
import { storeToken, storeUser, clearAuthStorage, readStoredAuth, isTokenExpired } from '@/lib/auth-storage';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import type { MarketDocument } from '@/lib/types';

interface User {
  _id: string;
  username: string;
  role: string;
  isOAuth?: boolean;
  balance?: number;
  bookmarkedDocuments?: Array<string | MarketDocument>;
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

function mergeUser(incoming: User, prev: User | null): User {
  const merged: User = { ...incoming, ...(prev ?? {}) };
  if (prev && prev.balance !== undefined) {
    merged.balance = prev.balance;
  }
  return merged;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOAuth, setIsOAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setIsOAuth(false);
    clearAuthStorage();

    try {
      await nextAuthSignOut({ redirect: false });
    } catch {
      // Ignore if session was already terminated
    }

    router.push('/login');
  }, [router]);

  // Sync with NextAuth session or a locally stored JWT.
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      logout();
      return;
    }

    if (sessionStatus === "authenticated" && session?.backendToken && session?.user) {
      setToken(session.backendToken);
      setIsOAuth(true);
      storeToken(session.backendToken);
      setUser((prev) => {
        const merged = mergeUser(session.user as unknown as User, prev);
        storeUser(merged);
        return merged;
      });
    } else if (sessionStatus === "unauthenticated") {
      const { token: storedToken, user: storedUser } = readStoredAuth();
      if (storedToken) {
        if (isTokenExpired(storedToken)) {
          logout();
        } else {
          setToken(storedToken);
          if (storedUser) {
            setUser((prev) => mergeUser(storedUser as unknown as User, prev));
          }
        }
      }
    }

    if (sessionStatus !== "loading") {
      setIsLoading(false);
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
        storeUser(updatedUser);
        return updatedUser;
      });
    } catch (e) {
      console.error("Failed to refresh profile:", e);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
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
      storeToken(data.token);
      storeUser(data.user);
      router.push('/');
    } catch (err) {
      setError(toErrorMessage(err));
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
    } catch (err) {
      setError(toErrorMessage(err));
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, password: string, email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiRegister(username, password, email);
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isHydrated = !isLoading;

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
