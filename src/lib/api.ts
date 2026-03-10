// src/lib/api.ts
import type { Article, Category, Comment, Media } from '@/lib/types';

// ---------------------------------------------------------------------------
// Base URL & fetch helper
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  '';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err) {
    console.error(`[apiFetch] Network error fetching ${url}:`, err);
    throw new Error(`Cannot connect to API server at ${url}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let message = `${res.status} ${res.statusText}`;
    try {
      const json = JSON.parse(body);
      if (json.message) message = json.message;
      else if (json.error?.message) message = json.error.message;
    } catch {
      // body is not JSON
    }
    console.error(`[apiFetch] ${res.status} ${res.statusText} — ${url}`, body.slice(0, 200));
    throw new Error(message);
  }
  return res.json();
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories(
  fetchOptions?: RequestInit,
): Promise<Category[]> {
  const res = await apiFetch<ApiEnvelope<Category[]>>('/categories', { next: { revalidate: 3600 }, ...fetchOptions });
  return res.data;
}

export async function createCategory(
  data: { name: string; slug: string; parentId?: string },
  token: string,
): Promise<Category> {
  const res = await apiFetch<ApiEnvelope<Category>>('/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteCategory(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/categories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export async function getArticles(
  fetchOptions?: RequestInit,
): Promise<Article[]> {
  const res = await apiFetch<ApiEnvelope<Article[]>>('/articles', { next: { revalidate: 3600 }, ...fetchOptions });
  return res.data;
}

export async function getArticlesByCategory(
  categorySlug: string,
  fetchOptions?: RequestInit,
): Promise<Article[]> {
  const res = await apiFetch<ApiEnvelope<Article[]>>(
    `/categories/${categorySlug}/articles`,
    { next: { revalidate: 3600 }, ...fetchOptions },
  );
  return res.data;
}

export async function getArticleBySlug(
  slug: string,
  fetchOptions?: RequestInit,
): Promise<Article | null> {
  try {
    const res = await apiFetch<ApiEnvelope<Article>>(`/articles/${slug}`, fetchOptions);
    return res.data;
  } catch {
    return null;
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
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginResponse {
  token: string;
  user: { _id: string; username: string; role: string };
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const res = await apiFetch<ApiEnvelope<LoginResponse>>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.data;
}

export async function register(
  username: string,
  password: string,
): Promise<{ message: string }> {
  const res = await apiFetch<ApiEnvelope<{ message: string }>>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.data;
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getComments(articleId: string): Promise<Comment[]> {
  const res = await apiFetch<ApiEnvelope<Comment[]>>(`/comments/article/${articleId}`);
  return res.data;
}

export async function createComment(
  articleId: string,
  content: string,
  token: string,
): Promise<Comment> {
  const res = await apiFetch<ApiEnvelope<Comment>>('/comments', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ articleId, content }),
  });
  return res.data;
}

export async function updateComment(
  commentId: string,
  content: string,
  token: string,
): Promise<Comment> {
  const res = await apiFetch<ApiEnvelope<Comment>>(`/comments/${commentId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ content }),
  });
  return res.data;
}

export async function deleteComment(
  commentId: string,
  token: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ---------------------------------------------------------------------------
// Access Requests
// ---------------------------------------------------------------------------

export interface AccessRequest {
  _id: string;
  user: { _id: string; username: string };
  article: { _id: string; title: string; slug: string };
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  createdAt: string;
}

export async function requestAccess(
  articleId: string,
  reason: string,
  token: string,
): Promise<{ message: string }> {
  const res = await apiFetch<ApiEnvelope<{ message: string; request: unknown }>>('/requests', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ articleId, reason }),
  });
  return { message: res.data.message };
}

export async function getAccessRequests(
  token: string,
): Promise<AccessRequest[]> {
  const res = await apiFetch<ApiEnvelope<AccessRequest[]>>('/requests', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function reviewAccessRequest(
  id: string,
  status: 'approved' | 'rejected',
  token: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/requests/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------------------------------------------------
// File Upload
// ---------------------------------------------------------------------------

export async function uploadFile(
  file: File,
  token: string,
  categoryPath: string,
): Promise<Media> {
  const formData = new FormData();
  formData.append('mediaFile', file);
  formData.append('categoryPath', categoryPath);

  const res = await fetch(`${API_BASE}/upload/single`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || 'File upload failed');
  }
  const data = await res.json();
  return data.data.media;
}
