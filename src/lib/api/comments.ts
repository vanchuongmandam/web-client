// src/lib/api/comments.ts
import { apiFetch, authHeaders, authHeaderOnly, buildQuery, type ApiEnvelope, type QueryParams } from './client';
import type { Comment, PaginatedResponse } from '@/lib/types';

export interface AccessRequest {
  _id: string;
  user: { _id: string; username: string };
  article: { _id: string; title: string; slug: string };
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  createdAt: string;
}

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
    headers: authHeaderOnly(token),
  });
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

export type AccessRequestParams = QueryParams & {
  page?: number;
  limit?: number;
  status?: string;
};

/** Get access requests with pagination and optional status filter. */
export async function getAccessRequestsPaginated(
  token: string,
  params?: AccessRequestParams,
): Promise<PaginatedResponse<AccessRequest>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<AccessRequest[]>>(`/requests${query}`, {
    headers: authHeaderOnly(token),
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function reviewAccessRequest(
  id: string,
  status: 'approved' | 'rejected',
  token: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/admin/requests/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export async function instantUnlock(
  articleId: string,
  mediaUrl: string,
  token: string,
): Promise<{ message: string }> {
  const res = await apiFetch<ApiEnvelope<{ message: string }>>('/requests/instant-unlock', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ articleId, mediaUrl }),
  });
  return res.data;
}
