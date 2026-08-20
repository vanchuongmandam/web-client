// src/lib/api/auth.ts
import { apiFetch, authHeaders, authHeaderOnly, type ApiEnvelope, type QueryParams } from './client';
import type { UserProfile, PublicProfile } from '@/lib/types';

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
  email: string,
): Promise<{ message: string }> {
  const res = await apiFetch<ApiEnvelope<{ message: string }>>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email }),
  });
  return res.data;
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const res = await apiFetch<ApiEnvelope<{ message: string }>>('/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.data;
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const res = await apiFetch<ApiEnvelope<{ message: string }>>('/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await apiFetch<ApiEnvelope<{ message: string }>>('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.data;
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const res = await apiFetch<ApiEnvelope<{ message: string }>>(`/auth/reset-password/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.data;
}

export async function changePassword(data: { currentPassword?: string; newPassword: string }, token: string): Promise<{ message: string }> {
  const payload = {
    oldPassword: data.currentPassword,
    newPassword: data.newPassword,
  };
  const res = await apiFetch<ApiEnvelope<{ message: string }>>('/auth/change-password', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function linkGoogleAccount(idToken: string, password?: string): Promise<LoginResponse> {
  const res = await apiFetch<ApiEnvelope<LoginResponse>>('/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, password, linkAccount: true }),
  });
  return res.data;
}

export async function getProfile(token: string): Promise<UserProfile> {
  const res = await apiFetch<ApiEnvelope<UserProfile>>('/auth/profile', {
    headers: authHeaderOnly(token),
  });
  return res.data;
}

export async function updateProfile(
  data: Partial<UserProfile>,
  token: string,
): Promise<UserProfile> {
  const res = await apiFetch<ApiEnvelope<UserProfile>>('/auth/profile', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getPublicProfile(usernameOrId: string): Promise<PublicProfile> {
  const res = await apiFetch<ApiEnvelope<PublicProfile>>(`/users/${usernameOrId}`, {
    next: { revalidate: 600 }
  });
  return res.data;
}

// Re-export QueryParams for convenience where auth queries are built.
export type { QueryParams };
