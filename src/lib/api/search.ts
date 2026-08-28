// src/lib/api/search.ts — unified search client (backend-proxy for Meilisearch)
import { apiFetch, buildQuery, type ApiEnvelope } from './client';

export type SearchType = 'all' | 'articles' | 'documents';

export interface SearchCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface SearchHit {
  id: string;
  slug: string;
  title: string;
  author: string;
  snippet: string;
  category: SearchCategory | null;
  type: 'article' | 'document';
  coverUrl?: string | null;
  coverImage?: string | null;
  publishTimestamp?: number | null;
  createdAt?: number | null;
  price?: number;
  isFree?: boolean;
  fileFormat?: string | null;
  rating?: { average: number; count: number } | null;
}

export interface SearchResults {
  articles: SearchHit[];
  documents: SearchHit[];
}

export interface SearchParams {
  q: string;
  type?: SearchType;
  limit?: number;
  page?: number;
  signal?: AbortSignal;
}

export async function search(params: SearchParams): Promise<SearchResults> {
  const { q, type = 'all', limit, page, signal } = params;
  const query = buildQuery({ q, type, limit, page });
  const res = await apiFetch<ApiEnvelope<SearchResults>>(`/search${query}`, {
    signal,
    cache: 'no-store',
  });
  return res.data;
}
