// src/lib/api/upload.ts
import { API_BASE } from './client';
import type { Media } from '@/lib/types';

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
