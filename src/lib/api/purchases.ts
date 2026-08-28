// src/lib/api/purchases.ts
import { apiFetch, authHeaders, authHeaderOnly, buildQuery, type ApiEnvelope, type QueryParams } from './client';
import type { Purchase, PaginatedResponse } from '@/lib/types';

export type PurchaseListParams = QueryParams & {
  page?: number;
  limit?: number;
};

export async function getUserPurchases(
  params?: PurchaseListParams,
  token?: string,
): Promise<PaginatedResponse<Purchase>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<Purchase[]>>(`/purchases${query}`, {
    headers: token ? authHeaderOnly(token) : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function checkDocumentOwnership(
  documentId: string,
  token: string,
): Promise<{ owned: boolean }> {
  const res = await apiFetch<ApiEnvelope<{ owned: boolean }>>(`/purchases/check/${documentId}`, {
    headers: authHeaderOnly(token),
  });
  return res.data;
}

export async function addReview(
  purchaseId: string,
  data: { rating: number; review?: string },
  token: string,
): Promise<Purchase> {
  const res = await apiFetch<ApiEnvelope<Purchase>>(`/purchases/${purchaseId}/review`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}
