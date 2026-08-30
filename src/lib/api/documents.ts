// src/lib/api/documents.ts
import { apiFetch, authHeaders, authHeaderOnly, buildQuery, type ApiEnvelope, type QueryParams } from './client';
import { ApiError } from '@/lib/errors';
import type { MarketDocument, Review, PaginatedResponse } from '@/lib/types';

export type DocumentListParams = QueryParams & {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  featured?: string;
  minPrice?: number;
  maxPrice?: number;
  isFree?: string;
  search?: string;
  status?: string;
  grade?: string;
  tag?: string;
  collection?: string;
};

export async function getDocuments(
  params?: DocumentListParams,
  fetchOptions?: RequestInit,
): Promise<PaginatedResponse<MarketDocument>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/documents${query}`, {
    next: { revalidate: 60 },
    ...fetchOptions,
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function getDocumentBySlug(
  slug: string,
  fetchOptions?: RequestInit,
): Promise<MarketDocument | null> {
  try {
    const res = await apiFetch<ApiEnvelope<MarketDocument>>(`/documents/${slug}`, {
      next: { revalidate: 60 },
      ...fetchOptions,
    });
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createDocument(
  data: Record<string, unknown>,
  token: string,
): Promise<MarketDocument> {
  const res = await apiFetch<ApiEnvelope<MarketDocument>>('/documents', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateDocument(
  slug: string,
  data: Record<string, unknown>,
  token: string,
): Promise<MarketDocument> {
  const res = await apiFetch<ApiEnvelope<MarketDocument>>(`/documents/${slug}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteDocument(
  slug: string,
  token: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/documents/${slug}`, {
    method: 'DELETE',
    headers: authHeaderOnly(token),
  });
}

export async function getDocumentDownload(
  documentId: string,
  token: string,
): Promise<{ downloadUrl: string; title: string; fileFormat: string }> {
  const res = await apiFetch<ApiEnvelope<{ downloadUrl: string; title: string; fileFormat: string }>>(
    `/documents/${documentId}/download`,
    { headers: authHeaderOnly(token) },
  );
  return res.data;
}

export async function getAdminDocuments(
  params?: DocumentListParams,
  token?: string,
): Promise<PaginatedResponse<MarketDocument>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/admin/documents${query}`, {
    headers: token ? authHeaderOnly(token) : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function toggleBookmark(documentId: string, token: string): Promise<{ bookmarked: boolean }> {
  const res = await apiFetch<ApiEnvelope<{ bookmarked: boolean }>>(`/documents/${documentId}/bookmark`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return res.data;
}

export async function getBookmarks(token: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<MarketDocument>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/documents/bookmarks${query}`, {
    headers: authHeaderOnly(token),
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function getReviews(documentId: string, params?: { page?: number; limit?: number; sort?: string }): Promise<PaginatedResponse<Review>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<Review[]>>(`/documents/${documentId}/reviews${query}`, {
    next: { revalidate: 60 }
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function createReview(documentId: string, rating: number, content: string, token: string): Promise<Review> {
  const res = await apiFetch<ApiEnvelope<Review>>(`/reviews`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ documentId, rating, content }),
  });
  return res.data;
}

export async function upvoteReview(reviewId: string, token: string): Promise<Review> {
  const res = await apiFetch<ApiEnvelope<Review>>(`/reviews/${reviewId}/vote`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return res.data;
}

export async function getRelatedDocuments(documentId: string, limit?: number): Promise<MarketDocument[]> {
  const query = buildQuery({ limit });
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/documents/${documentId}/related${query}`, {
    next: { revalidate: 3600 }
  });
  return res.data;
}

export async function getSuggestions(token?: string, limit?: number): Promise<MarketDocument[]> {
  const query = buildQuery({ limit });
  const headers = token ? authHeaders(token) : {};
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/documents/suggestions${query}`, {
    headers,
    next: { revalidate: 3600 }
  });
  return res.data;
}
