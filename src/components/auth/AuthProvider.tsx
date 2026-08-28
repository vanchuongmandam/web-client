// src/components/auth/AuthProvider.tsx
"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore, type AuthUser } from '@/stores/auth.store';
import { readStoredAuth, isTokenExpired } from '@/lib/auth-storage';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();

  // Sync the NextAuth (Google) session into the store.
  useEffect(() => {
    if (sessionStatus === 'loading') return;

    const { setSession, setLoading, logout } = useAuthStore.getState();

    if (session?.error === 'RefreshAccessTokenError') {
      void logout();
      return;
    }

    if (sessionStatus === 'authenticated' && session?.backendToken && session?.user) {
      setSession(session.backendToken, session.user as unknown as AuthUser, true);
    } else {
      setLoading(false);
    }
  }, [session, sessionStatus]);

  // Finalize hydration after mount: migrate legacy storage, validate expiry, refresh profile.
  useEffect(() => {
    const state = useAuthStore.getState();

    // One-time migration from legacy localStorage keys (authToken / authUser).
    if (!state.token) {
      const legacy = readStoredAuth();
      if (legacy.token && !isTokenExpired(legacy.token)) {
        const legacyUser = legacy.user as unknown as AuthUser | null;
        if (legacyUser?._id) {
          state.setSession(legacy.token, legacyUser, Boolean(legacyUser.isOAuth));
        }
      }
    }

    const { token, logout } = useAuthStore.getState();

    if (token && isTokenExpired(token)) {
      void logout();
      return;
    }

    state.setHasHydrated(true);

    if (token) {
      void state.refreshProfile();
    }
  }, []);

  return <>{children}</>;
}
