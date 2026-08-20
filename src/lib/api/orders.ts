// src/lib/api/orders.ts
import { apiFetch, authHeaders, authHeaderOnly, buildQuery, type ApiEnvelope, type QueryParams } from './client';
import type { Order, Coupon, PaginatedResponse } from '@/lib/types';

export type OrderListParams = QueryParams & {
  page?: number;
  limit?: number;
  status?: string;
};

export async function createOrder(
  documentIds: string[],
  token: string,
  useBalance?: boolean,
  couponCode?: string,
): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>('/orders', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ documentIds, useBalance, couponCode }),
  });
  return res.data;
}

export async function getUserOrders(
  params?: OrderListParams,
  token?: string,
): Promise<PaginatedResponse<Order>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<Order[]>>(`/orders${query}`, {
    headers: token ? authHeaderOnly(token) : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function getOrderByCode(
  orderCode: string,
  token: string,
): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>(`/orders/${orderCode}`, {
    headers: authHeaderOnly(token),
  });
  return res.data;
}

export async function cancelOrder(
  orderCode: string,
  token: string,
): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>(`/orders/${orderCode}/cancel`, {
    method: 'PATCH',
    headers: authHeaderOnly(token),
  });
  return res.data;
}

export async function getAdminOrders(
  params?: OrderListParams,
  token?: string,
): Promise<PaginatedResponse<Order>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<Order[]>>(`/admin/orders${query}`, {
    headers: token ? authHeaderOnly(token) : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function confirmAdminOrder(
  orderCode: string,
  token: string,
  note?: string,
): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>(`/admin/orders/${orderCode}/confirm`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(note ? { note } : {}),
  });
  return res.data;
}

export async function refundAdminOrder(
  orderCode: string,
  token: string,
  note?: string,
): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>(`/admin/orders/${orderCode}/refund`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(note ? { note } : {}),
  });
  return res.data;
}

export async function createDepositOrder(amount: number, token: string): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>('/orders/deposit', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ amount }),
  });
  return res.data;
}

export async function validateCoupon(code: string, documentIds: string[], token: string): Promise<{ coupon: Coupon; discountAmount: number }> {
  const res = await apiFetch<ApiEnvelope<{ coupon: Coupon; discountAmount: number }>>('/coupons/validate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ code, documentIds }),
  });
  return res.data;
}
