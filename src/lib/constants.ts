// src/lib/constants.ts — Shared configuration constants

/**
 * Category slugs displayed in the left column of the homepage.
 * Update these if categories are renamed or reorganized in the CMS.
 */
export const HOMEPAGE_LEFT_COLUMN_SLUGS = [
  'danh-cho-chuyen-van',
  'van-chuong-hoc-va-thi',
  'van-chuong-thu-vi',
  'dien-dan-van-chuong',
] as const;

/**
 * Category slugs displayed in the right column of the homepage.
 */
export const HOMEPAGE_RIGHT_COLUMN_SLUGS = [
  'goc-sang-tac',
] as const;

/**
 * Number of articles to display per category section on the homepage.
 */
export const HOMEPAGE_ARTICLES_PER_CATEGORY = 4;
