// src/lib/api/articles.ts
import { apiFetch, authHeaders, authHeaderOnly, buildQuery, type ApiEnvelope, type QueryParams } from './client';
import { ApiError } from '@/lib/errors';
import type { Article, PaginatedResponse } from '@/lib/types';

export type ArticlePaginationParams = QueryParams & {
  page?: number;
  limit?: number;
  sort?: string;
};

/** Get articles (returns only the data array, for simple use cases like homepage). */
export async function getArticles(
  params?: ArticlePaginationParams,
  fetchOptions?: RequestInit,
): Promise<Article[]> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<Article[]>>(`/articles${query}`, { next: { revalidate: 3600 }, ...fetchOptions });
  return res.data;
}

/** Get articles with full pagination metadata. */
export async function getArticlesPaginated(
  params?: ArticlePaginationParams,
  fetchOptions?: RequestInit,
): Promise<PaginatedResponse<Article>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<Article[]>>(`/articles${query}`, { next: { revalidate: 3600 }, ...fetchOptions });
  return { data: res.data, pagination: res.pagination! };
}

export async function getArticlesByCategoryPaginated(
  categorySlug: string,
  params?: ArticlePaginationParams,
  fetchOptions?: RequestInit,
): Promise<PaginatedResponse<Article>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<Article[]>>(
    `/categories/${categorySlug}/articles${query}`,
    { next: { revalidate: 3600 }, ...fetchOptions },
  );
  return { data: res.data, pagination: res.pagination! };
}

/** Search articles with text query and pagination metadata. */
export async function searchArticlesPaginated(
  searchQuery: string,
  params?: ArticlePaginationParams,
  fetchOptions?: RequestInit,
): Promise<PaginatedResponse<Article>> {
  const res = await apiFetch<ApiEnvelope<Article[]>>(
    `/articles/search?q=${encodeURIComponent(searchQuery)}${buildQuery(params, '&')}`,
    fetchOptions,
  );
  return { data: res.data, pagination: res.pagination! };
}

export async function getArticleBySlug(
  slug: string,
  fetchOptions?: RequestInit,
): Promise<Article | null> {
  try {
    const res = await apiFetch<ApiEnvelope<Article>>(`/articles/${slug}`, {
      next: { revalidate: 3600 },
      ...fetchOptions,
    });
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createArticle(
  data: Record<string, unknown>,
  token: string,
): Promise<Article> {
  const res = await apiFetch<ApiEnvelope<Article>>('/articles', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateArticle(
  slug: string,
  data: Record<string, unknown>,
  token: string,
): Promise<Article> {
  const res = await apiFetch<ApiEnvelope<Article>>(`/articles/${slug}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteArticle(
  slug: string,
  token: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/articles/${slug}`, {
    method: 'DELETE',
    headers: authHeaderOnly(token),
  });
}

export async function getArticleSuggestions(
  currentSlug: string,
  categoryId: string,
): Promise<Article[]> {
  const query = buildQuery({ current_slug: currentSlug, categoryId });
  const res = await apiFetch<ApiEnvelope<Article[]>>(`/articles/suggestions${query}`, { next: { revalidate: 3600 } });
  return res.data;
}
