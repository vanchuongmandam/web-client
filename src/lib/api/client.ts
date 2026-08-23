// src/lib/api/client.ts
import { ApiError } from '@/lib/errors';
import type { PaginationMeta } from '@/lib/types';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  '';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') throw err;
    console.error(`[apiFetch] Network error fetching ${url}:`, err);
    throw new Error(`Cannot connect to API server at ${url}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let message = `${res.status} ${res.statusText}`;
    let payload: unknown;
    try {
      const json = JSON.parse(body);
      payload = json;
      if (json.message) message = json.message;
      else if (json.error?.message) message = json.error.message;
    } catch {
      // body is not JSON
    }
    console.error(`[apiFetch] ${res.status} ${res.statusText} — ${url}`, body.slice(0, 200));
    throw new ApiError(message, res.status, payload);
  }
  return res.json();
}

export function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function authHeaderOnly(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export type QueryValue = string | number | boolean | undefined;
export type QueryParams = Record<string, QueryValue>;

/** Build query string from key-value params, ignoring undefined values. */
export function buildQuery(params: QueryParams = {}, prefix: '?' | '&' = '?'): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return `${prefix}${entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}`;
}
