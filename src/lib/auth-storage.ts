// src/lib/auth-storage.ts
import { jwtDecode } from 'jwt-decode';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

export function storeToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  document.cookie = `authToken=${token}; path=/; max-age=604800; SameSite=Lax`;
}

export function storeUser(user: unknown): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthStorage(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

export function readStoredAuth(): { token: string | null; user: Record<string, unknown> | null } {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  let user: Record<string, unknown> | null = null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (raw && raw !== 'undefined') {
    try {
      user = JSON.parse(raw);
    } catch {
      user = null;
    }
  }
  return { token, user };
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
