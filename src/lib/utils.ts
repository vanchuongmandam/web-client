import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Category } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function findCategoryBySlug(categories: Category[], slug: string): Category | null {
  for (const cat of categories) {
    if (cat.slug === slug) return cat;
    if (cat.children) {
      const found = findCategoryBySlug(cat.children, slug);
      if (found) return found;
    }
  }
  return null;
}

export function findCategoryWithParent(
  slug: string,
  categories: Category[],
  parent: Category | null = null
): { found: Category; parent: Category | null } | null {
  for (const category of categories) {
    if (category.slug === slug) {
      return { found: category, parent };
    }
    if (category.children && category.children.length > 0) {
      const result = findCategoryWithParent(slug, category.children, category);
      if (result) return result;
    }
  }
  return null;
}

export function getDescendantCategorySlugs(category: Category): string[] {
  let slugs = [category.slug];
  if (category.children && category.children.length > 0) {
    category.children.forEach(child => {
      slugs = slugs.concat(getDescendantCategorySlugs(child));
    });
  }
  return slugs;
}

export const generateSlug = (name: string): string => {
  if (!name) return '';

  const nonAccentVietnamese = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');

  return nonAccentVietnamese
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Format a date string or Date object into Vietnamese display format.
 * Example: "2024-07-15T00:00:00.000Z" → "15 tháng 7, 2024"
 */
export function formatVietnameseDate(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day} tháng ${month}, ${year}`;
}
