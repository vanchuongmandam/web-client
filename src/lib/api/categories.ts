// src/lib/api/categories.ts
import { apiFetch, authHeaders, authHeaderOnly, type ApiEnvelope } from './client';
import type { Category, DocumentCategory, DocumentCollection } from '@/lib/types';

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
    headers: authHeaderOnly(token),
  });
}

export async function getDocumentCategories(
  fetchOptions?: RequestInit,
): Promise<DocumentCategory[]> {
  const res = await apiFetch<ApiEnvelope<DocumentCategory[]>>('/document-categories', { next: { revalidate: 3600 }, ...fetchOptions });
  return res.data;
}

export async function createDocumentCategory(
  data: { name: string; slug: string; parent?: string },
  token: string,
): Promise<DocumentCategory> {
  const res = await apiFetch<ApiEnvelope<DocumentCategory>>('/document-categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteDocumentCategory(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/document-categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function getDocumentCollections(
  fetchOptions?: RequestInit,
): Promise<DocumentCollection[]> {
  const res = await apiFetch<ApiEnvelope<DocumentCollection[]>>('/document-collections', { next: { revalidate: 3600 }, ...fetchOptions });
  return res.data;
}

export async function createDocumentCollection(
  data: { name: string; slug: string; description?: string },
  token: string,
): Promise<DocumentCollection> {
  const res = await apiFetch<ApiEnvelope<DocumentCollection>>('/document-collections', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteDocumentCollection(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/document-collections/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
