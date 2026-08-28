// src/lib/errors.ts

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function toErrorMessage(
  err: unknown,
  fallback = 'Đã có lỗi không xác định xảy ra',
): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
