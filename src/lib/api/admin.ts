// src/lib/api/admin.ts
import { apiFetch, authHeaders, authHeaderOnly, buildQuery, type ApiEnvelope, type QueryParams } from './client';
import type { AdminDashboardStats, AdminUser, Coupon, PaginatedResponse } from '@/lib/types';

export type AdminUserListParams = QueryParams & {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string;
};

export async function getAdminStats(token: string): Promise<AdminDashboardStats> {
  const res = await apiFetch<ApiEnvelope<AdminDashboardStats>>('/admin/stats', {
    headers: authHeaderOnly(token),
  });
  return res.data;
}

export async function getAdminUsers(
  params?: AdminUserListParams,
  token?: string,
): Promise<PaginatedResponse<AdminUser>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<AdminUser[]>>(`/admin/users${query}`, {
    headers: token ? authHeaderOnly(token) : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function updateAdminUserRole(id: string, role: 'admin' | 'user', token: string): Promise<AdminUser> {
  const res = await apiFetch<ApiEnvelope<AdminUser>>(`/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  return res.data;
}

export async function updateAdminUserStatus(id: string, isActive: boolean, token: string): Promise<AdminUser> {
  const res = await apiFetch<ApiEnvelope<AdminUser>>(`/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ isActive }),
  });
  return res.data;
}

export interface BalanceAdjustment {
  [key: string]: unknown;
}

export async function adjustAdminUserBalance(
  id: string,
  amount: number,
  reason: string,
  token: string,
): Promise<{ user: AdminUser; adjustment: BalanceAdjustment }> {
  const res = await apiFetch<ApiEnvelope<{ user: AdminUser; adjustment: BalanceAdjustment }>>(`/admin/users/${id}/balance`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ amount, reason }),
  });
  return res.data;
}

export async function getAdminCoupons(
  params?: { page?: number; limit?: number },
  token?: string,
): Promise<PaginatedResponse<Coupon>> {
  const query = buildQuery(params);
  const res = await apiFetch<ApiEnvelope<Coupon[]>>(`/admin/coupons${query}`, {
    headers: token ? authHeaderOnly(token) : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function createAdminCoupon(data: Partial<Coupon>, token: string): Promise<Coupon> {
  const res = await apiFetch<ApiEnvelope<Coupon>>('/admin/coupons', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateAdminCoupon(id: string, data: Partial<Coupon>, token: string): Promise<Coupon> {
  const res = await apiFetch<ApiEnvelope<Coupon>>(`/admin/coupons/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteAdminCoupon(id: string, token: string): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/admin/coupons/${id}`, {
    method: 'DELETE',
    headers: authHeaderOnly(token),
  });
}
