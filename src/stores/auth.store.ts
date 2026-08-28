// src/stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { login as apiLogin, register as apiRegister, getProfile, toggleBookmark } from '@/lib/api';
import { ApiError, toErrorMessage } from '@/lib/errors';
import { storeToken, storeUser, clearAuthStorage } from '@/lib/auth-storage';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import type { UserProfile } from '@/lib/types';

export type AuthUser = Partial<UserProfile> & Pick<UserProfile, '_id' | 'username' | 'role'>;

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isOAuth: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  error: string | null;
  bookmarkedDocumentIds: string[];
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (token: string, user: AuthUser, isOAuth?: boolean) => void;
  refreshProfile: () => Promise<void>;
  toggleBookmarkOptimistic: (documentId: string) => Promise<boolean>;
  clearError: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
}

function mergeUser(incoming: AuthUser, prev: AuthUser | null): AuthUser {
  const merged: AuthUser = { ...incoming, ...(prev ?? {}) };
  if (prev && prev.balance !== undefined) {
    merged.balance = prev.balance;
  }
  return merged;
}

function extractBookmarkIds(user: AuthUser | null): string[] {
  if (!user?.bookmarkedDocuments) return [];
  return user.bookmarkedDocuments
    .map((b) => (typeof b === 'string' ? b : b._id))
    .filter(Boolean) as string[];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isOAuth: false,
      isLoading: true,
      hasHydrated: false,
      error: null,
      bookmarkedDocumentIds: [],

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiLogin(username, password);
          set({
            token: data.token,
            user: data.user as AuthUser,
            isOAuth: false,
            bookmarkedDocumentIds: [],
          });
          storeToken(data.token);
          storeUser(data.user);
          if (typeof window !== 'undefined') {
            window.location.assign('/');
          }
        } catch (err) {
          set({ error: toErrorMessage(err) });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          await nextAuthSignIn('google');
        } catch (err) {
          set({ error: toErrorMessage(err), isLoading: false });
        }
      },

      register: async (username, password, email) => {
        set({ isLoading: true, error: null });
        try {
          await apiRegister(username, password, email);
        } catch (err) {
          set({ error: toErrorMessage(err) });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({
          user: null,
          token: null,
          isOAuth: false,
          error: null,
          isLoading: false,
          hasHydrated: true,
          bookmarkedDocumentIds: [],
        });
        clearAuthStorage();

        try {
          await nextAuthSignOut({ redirect: false });
        } catch {
          // Ignore if session was already terminated
        }

        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }
      },

      setSession: (token, user, isOAuth = false) => {
        storeToken(token);
        set((state) => {
          const merged = mergeUser(user, state.user);
          storeUser(merged);
          return {
            token,
            user: merged,
            isOAuth,
            isLoading: false,
            bookmarkedDocumentIds: extractBookmarkIds(merged),
          };
        });
      },

      refreshProfile: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const profile = await getProfile(token);
          set((state) => {
            const baseUser = state.user ?? {
              _id: profile._id,
              username: profile.username,
              role: profile.role,
            };
            const updatedUser: AuthUser = {
              ...baseUser,
              balance: profile.balance,
              avatar: profile.avatar,
              displayName: profile.displayName,
              email: profile.email,
              bookmarkedDocuments: profile.bookmarkedDocuments,
            };
            storeUser(updatedUser);
            return {
              user: updatedUser,
              bookmarkedDocumentIds: extractBookmarkIds(updatedUser),
            };
          });
        } catch (e) {
          console.error('Failed to refresh profile:', e);
          if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
            await get().logout();
          }
        }
      },

      toggleBookmarkOptimistic: async (documentId) => {
        const token = get().token;
        if (!token) return false;

        const prev = get().bookmarkedDocumentIds;
        const isBookmarked = prev.includes(documentId);
        const optimistic = isBookmarked
          ? prev.filter((id) => id !== documentId)
          : [...prev, documentId];

        // Step 1 (0ms): apply the optimistic change immediately
        set({ bookmarkedDocumentIds: optimistic });

        try {
          // Step 2: reconcile with the server
          const res = await toggleBookmark(documentId, token);
          set((state) => ({
            bookmarkedDocumentIds: res.bookmarked
              ? Array.from(new Set([...state.bookmarkedDocumentIds, documentId]))
              : state.bookmarkedDocumentIds.filter((id) => id !== documentId),
          }));
          return res.bookmarked;
        } catch (err) {
          // Step 3: rollback on failure
          set({ bookmarkedDocumentIds: prev });
          throw err;
        }
      },

      clearError: () => set({ error: null }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'vcmd-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isOAuth: state.isOAuth,
        bookmarkedDocumentIds: state.bookmarkedDocumentIds,
      }),
    }
  )
);
