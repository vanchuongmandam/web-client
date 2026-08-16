import type {
  Article,
  Category,
  DocumentCategory,
  DocumentCollection,
  Comment,
  Media,
  PaginationMeta,
  PaginatedResponse,
  MarketDocument,
  Order,
  Purchase,
  UserProfile,
  BillingAddress,
  AdminDashboardStats,
  Review,
  PublicProfile,
  Coupon,
  CouponStat,
  AdminUser,
} from '@/lib/types';

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
  pagination?: PaginationMeta;
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

/** Build query string from key-value params, ignoring undefined values. */
function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
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
// Document Categories
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Document Collections
// ---------------------------------------------------------------------------

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

export async function updateDocumentCollection(
  id: string,
  data: Partial<DocumentCollection>,
  token: string,
): Promise<DocumentCollection> {
  const res = await apiFetch<ApiEnvelope<DocumentCollection>>(`/document-collections/${id}`, {
    method: 'PUT',
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

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export interface ArticlePaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

/** Get articles (returns only the data array, for simple use cases like homepage). */
export async function getArticles(
  params?: ArticlePaginationParams,
  fetchOptions?: RequestInit,
): Promise<Article[]> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<Article[]>>(`/articles${query}`, { next: { revalidate: 3600 }, ...fetchOptions });
  return res.data;
}

/** Get articles with full pagination metadata. */
export async function getArticlesPaginated(
  params?: ArticlePaginationParams,
  fetchOptions?: RequestInit,
): Promise<PaginatedResponse<Article>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<Article[]>>(`/articles${query}`, { next: { revalidate: 3600 }, ...fetchOptions });
  return { data: res.data, pagination: res.pagination! };
}

/** Get articles by category slug (returns only data). */
export async function getArticlesByCategory(
  categorySlug: string,
  params?: ArticlePaginationParams,
  fetchOptions?: RequestInit,
): Promise<Article[]> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<Article[]>>(
    `/categories/${categorySlug}/articles${query}`,
    { next: { revalidate: 3600 }, ...fetchOptions },
  );
  return res.data;
}

export async function getArticlesByCategoryPaginated(
  categorySlug: string,
  params?: ArticlePaginationParams,
  fetchOptions?: RequestInit,
): Promise<PaginatedResponse<Article>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
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
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  // Use manual fetch because we want to format query nicely and avoid double encoding `?q=` vs `&q=`
  const baseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/articles/search?q=${encodeURIComponent(searchQuery)}`;
  const finalUrl = query ? `${baseUrl}&${query}` : baseUrl;
  
  const res = await fetch(finalUrl, fetchOptions);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to search articles');
  }
  const json = await res.json();
  return { data: json.data, pagination: json.pagination! };
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

/** Get access requests (returns only data, for backward compatibility). */
export async function getAccessRequests(
  token: string,
): Promise<AccessRequest[]> {
  const res = await apiFetch<ApiEnvelope<AccessRequest[]>>('/requests', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/** Get access requests with pagination and optional status filter. */
export async function getAccessRequestsPaginated(
  token: string,
  params?: { page?: number; limit?: number; status?: string },
): Promise<PaginatedResponse<AccessRequest>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<AccessRequest[]>>(`/requests${query}`, {
    headers: { Authorization: `Bearer ${token}` },
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

// ---------------------------------------------------------------------------
// File Upload
// ---------------------------------------------------------------------------

export async function uploadFile(
  file: File,
  token: string,
  categoryPath: string,
  isPrivate: boolean = false,
): Promise<Media> {
  return uploadFileWithProgress(file, token, categoryPath, undefined, isPrivate);
}

export async function uploadFileWithProgress(
  file: File,
  token: string,
  categoryPath: string,
  onProgress?: (percent: number) => void,
  isPrivate: boolean = false,
): Promise<Media> {
  const formData = new FormData();
  formData.append('mediaFile', file);
  formData.append('categoryPath', categoryPath);
  if (isPrivate) {
    formData.append('isPrivate', 'true');
  }

  if (typeof XMLHttpRequest !== 'undefined') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/upload/single`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (!onProgress || !event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      };

      xhr.onerror = () => reject(new Error('Upload failed due to a network error'));

      xhr.onload = () => {
        let payload: { message?: string; data?: { media?: Media } } | null = null;
        try {
          payload = JSON.parse(xhr.responseText || '{}');
        } catch {
          payload = null;
        }

        if (xhr.status >= 200 && xhr.status < 300 && payload?.data?.media) {
          onProgress?.(100);
          resolve(payload.data.media);
          return;
        }

        reject(new Error(payload?.message || 'File upload failed'));
      };

      xhr.send(formData);
    });
  }

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
  onProgress?.(100);
  return data.data.media;
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export async function getProfile(token: string): Promise<UserProfile> {
  const res = await apiFetch<ApiEnvelope<UserProfile>>('/auth/profile', {
    headers: { Authorization: `Bearer ${token}` },
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

// ---------------------------------------------------------------------------
// Documents (Marketplace)
// ---------------------------------------------------------------------------

export interface DocumentListParams {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  featured?: string;
  minPrice?: number;
  maxPrice?: number;
  isFree?: string;
  search?: string;
  status?: string;
  grade?: string;
  tag?: string;
  collection?: string;
}

export async function getDocuments(
  params?: DocumentListParams,
  fetchOptions?: RequestInit,
): Promise<PaginatedResponse<MarketDocument>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/documents${query}`, {
    next: { revalidate: 60 },
    ...fetchOptions,
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function getDocumentBySlug(
  slug: string,
  fetchOptions?: RequestInit,
): Promise<MarketDocument | null> {
  try {
    const res = await apiFetch<ApiEnvelope<MarketDocument>>(`/documents/${slug}`, fetchOptions);
    return res.data;
  } catch {
    return null;
  }
}

export async function createDocument(
  data: Record<string, unknown>,
  token: string,
): Promise<MarketDocument> {
  const res = await apiFetch<ApiEnvelope<MarketDocument>>('/documents', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateDocument(
  slug: string,
  data: Record<string, unknown>,
  token: string,
): Promise<MarketDocument> {
  const res = await apiFetch<ApiEnvelope<MarketDocument>>(`/documents/${slug}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteDocument(
  slug: string,
  token: string,
): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/documents/${slug}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getDocumentDownload(
  documentId: string,
  token: string,
): Promise<{ downloadUrl: string; title: string; fileFormat: string }> {
  const res = await apiFetch<ApiEnvelope<{ downloadUrl: string; title: string; fileFormat: string }>>(
    `/documents/${documentId}/download`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}

export async function getAdminDocuments(
  params?: DocumentListParams,
  token?: string,
): Promise<PaginatedResponse<MarketDocument>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/admin/documents${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

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

export async function walletPay(
  documentIds: string[],
  token: string,
  couponCode?: string,
): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>('/orders/wallet-pay', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ documentIds, couponCode }),
  });
  return res.data;
}

export async function getUserOrders(
  params?: { page?: number; limit?: number; status?: string },
  token?: string,
): Promise<PaginatedResponse<Order>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<Order[]>>(`/orders${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function getOrderByCode(
  orderCode: string,
  token: string,
): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>(`/orders/${orderCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function cancelOrder(
  orderCode: string,
  token: string,
): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>(`/orders/${orderCode}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getAdminOrders(
  params?: { page?: number; limit?: number; status?: string },
  token?: string,
): Promise<PaginatedResponse<Order>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<Order[]>>(`/admin/orders${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

export async function getAdminStats(token: string): Promise<AdminDashboardStats> {
  const res = await apiFetch<ApiEnvelope<AdminDashboardStats>>('/admin/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ---------------------------------------------------------------------------
// Admin Users & Coupons
// ---------------------------------------------------------------------------

export async function getAdminUsers(
  params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: string },
  token?: string,
): Promise<PaginatedResponse<AdminUser>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<AdminUser[]>>(`/admin/users${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function getAdminUserById(id: string, token: string): Promise<AdminUser & { purchases: Purchase[] }> {
  const res = await apiFetch<ApiEnvelope<AdminUser & { purchases: Purchase[] }>>(`/admin/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
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

export async function adjustAdminUserBalance(id: string, amount: number, reason: string, token: string): Promise<{ user: AdminUser, adjustment: any }> {
  const res = await apiFetch<ApiEnvelope<{ user: AdminUser, adjustment: any }>>(`/admin/users/${id}/balance`, {
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
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<Coupon[]>>(`/admin/coupons${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function validateCoupon(code: string, documentIds: string[], token: string): Promise<{ coupon: Coupon; discountAmount: number }> {
  const res = await apiFetch<ApiEnvelope<{ coupon: Coupon; discountAmount: number }>>('/coupons/validate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ code, documentIds }),
  });
  return res.data;
}

// ---------------------------------------------------------------------------
// Purchases
// ---------------------------------------------------------------------------

export async function getUserPurchases(
  params?: { page?: number; limit?: number },
  token?: string,
): Promise<PaginatedResponse<Purchase>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<Purchase[]>>(`/purchases${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function checkDocumentOwnership(
  documentId: string,
  token: string,
): Promise<{ owned: boolean }> {
  const res = await apiFetch<ApiEnvelope<{ owned: boolean }>>(`/purchases/check/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
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

// ---------------------------------------------------------------------------
// Marketplace Additions
// ---------------------------------------------------------------------------

export async function createDepositOrder(amount: number, token: string): Promise<Order> {
  const res = await apiFetch<ApiEnvelope<Order>>('/orders/deposit', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ amount }),
  });
  return res.data;
}

export async function toggleBookmark(documentId: string, token: string): Promise<{ bookmarked: boolean }> {
  const res = await apiFetch<ApiEnvelope<{ bookmarked: boolean }>>(`/documents/${documentId}/bookmark`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return res.data;
}

export async function getBookmarks(token: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<MarketDocument>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/documents/bookmarks${query}`, {
    headers: authHeaders(token),
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function getReviews(documentId: string, params?: { page?: number; limit?: number; sort?: string }): Promise<PaginatedResponse<Review>> {
  const query = buildQuery(params as Record<string, string | number | undefined> || {});
  const res = await apiFetch<ApiEnvelope<Review[]>>(`/documents/${documentId}/reviews${query}`, {
    next: { revalidate: 60 }
  });
  return { data: res.data, pagination: res.pagination! };
}

export async function createReview(documentId: string, rating: number, content: string, token: string): Promise<Review> {
  const res = await apiFetch<ApiEnvelope<Review>>(`/reviews`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ documentId, rating, content }),
  });
  return res.data;
}

export async function upvoteReview(reviewId: string, token: string): Promise<Review> {
  const res = await apiFetch<ApiEnvelope<Review>>(`/reviews/${reviewId}/vote`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return res.data;
}

export async function getRelatedDocuments(documentId: string, limit?: number): Promise<MarketDocument[]> {
  const query = buildQuery({ limit });
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/documents/${documentId}/related${query}`, {
    next: { revalidate: 3600 }
  });
  return res.data;
}

export async function getSuggestions(token?: string, limit?: number): Promise<MarketDocument[]> {
  const query = buildQuery({ limit });
  const headers = token ? authHeaders(token) : {};
  const res = await apiFetch<ApiEnvelope<MarketDocument[]>>(`/documents/suggestions${query}`, {
    headers,
    next: { revalidate: 3600 } // Cache might be tricky for personalized stuff.
  });
  return res.data;
}

export async function getArticleSuggestions(
  currentSlug: string,
  categoryId: string,
): Promise<Article[]> {
  const query = buildQuery({ current_slug: currentSlug, categoryId });
  const res = await apiFetch<ApiEnvelope<Article[]>>(`/articles/suggestions${query}`);
  return res.data;
}

export async function getPublicProfile(usernameOrId: string): Promise<PublicProfile> {
  const res = await apiFetch<ApiEnvelope<PublicProfile>>(`/users/${usernameOrId}`, {
    next: { revalidate: 600 }
  });
  return res.data;
}
