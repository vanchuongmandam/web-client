// src/lib/api/settings.ts
import { apiFetch, authHeaders, authHeaderOnly, type ApiEnvelope } from './client';
import type { ContactSettings } from '@/lib/types';

export async function getContactSettings(): Promise<ContactSettings> {
  const res = await apiFetch<ApiEnvelope<ContactSettings>>('/settings/contact', {
    headers: {},
  });
  return res.data;
}

export async function getAdminSettings(token: string): Promise<{ contact: ContactSettings }> {
  const res = await apiFetch<ApiEnvelope<{ contact: ContactSettings }>>('/admin/settings', {
    headers: authHeaderOnly(token),
  });
  return res.data;
}

export async function updateContactSettings(
  payload: ContactSettings,
  token: string,
): Promise<ContactSettings> {
  const res = await apiFetch<ApiEnvelope<ContactSettings>>('/admin/settings/contact', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.data;
}
