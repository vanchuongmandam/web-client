// src/lib/api.ts
import type { Category } from '@/lib/types';

export async function getCategories(): Promise<Category[]> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const res = await fetch(`${apiBaseUrl}/categories`, {
      next: { revalidate: 3600 }, // cache 1h
    });
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    return [];
  }
}
