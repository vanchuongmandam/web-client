// src/lib/api.ts
import type { Article, Category, Comment, Media } from '@/lib/types';

// ---------------------------------------------------------------------------
// Base URL & fetch helper
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  '';

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
  return apiFetch<Category[]>('/categories', { next: { revalidate: 3600 }, ...fetchOptions });
}

export async function createCategory(
  data: { name: string; slug: string; parentId?: string },
  token: string,
): Promise<Category> {
  return apiFetch<Category>('/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch<void>(`/categories/${id}`, {
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
  const res = await apiFetch<{ success: boolean; data: Article[] }>('/articles', { next: { revalidate: 3600 }, ...fetchOptions });
  return res.data;
}

export async function getArticlesByCategory(
  categorySlug: string,
  fetchOptions?: RequestInit,
): Promise<Article[]> {
  return apiFetch<Article[]>(
    `/categories/${categorySlug}/articles`,
    { next: { revalidate: 3600 }, ...fetchOptions },
  );
}

export async function getArticleBySlug(
  slug: string,
  fetchOptions?: RequestInit,
): Promise<Article | null> {
  try {
    return await apiFetch<Article>(`/articles/${slug}`, fetchOptions);
  } catch {
    return null;
  }
}

export async function createArticle(
  data: Record<string, unknown>,
  token: string,
): Promise<Article> {
  return apiFetch<Article>('/articles', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function updateArticle(
  slug: string,
  data: Record<string, unknown>,
  token: string,
): Promise<Article> {
  return apiFetch<Article>(`/articles/${slug}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function deleteArticle(
  slug: string,
  token: string,
): Promise<void> {
  await apiFetch<void>(`/articles/${slug}`, {
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
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function register(
  username: string,
  password: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role: 'user' }),
  });
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getComments(articleId: string): Promise<Comment[]> {
  const res = await apiFetch<{ success: boolean; data: Comment[] }>(`/comments/article/${articleId}`);
  return res.data;
}

export async function createComment(
  articleId: string,
  content: string,
  token: string,
): Promise<Comment> {
  return apiFetch<Comment>('/comments', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ articleId, content }),
  });
}

export async function updateComment(
  commentId: string,
  content: string,
  token: string,
): Promise<Comment> {
  return apiFetch<Comment>(`/comments/${commentId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(
  commentId: string,
  token: string,
): Promise<void> {
  await apiFetch<void>(`/comments/${commentId}`, {
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
  return apiFetch<{ message: string }>('/requests', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ articleId, reason }),
  });
}

export async function getAccessRequests(
  token: string,
): Promise<AccessRequest[]> {
  return apiFetch<AccessRequest[]>('/requests', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function reviewAccessRequest(
  id: string,
  status: 'approved' | 'rejected',
  token: string,
): Promise<void> {
  await apiFetch<void>(`/requests/${id}/status`, {
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
  return data.media;
}
