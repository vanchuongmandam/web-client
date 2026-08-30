// src/lib/document-utils.ts

export interface BookCoverTheme {
  bg: string;
  text: string;
  border: string;
  tagBg: string;
  lineBg: string;
}

const BOOK_COVER_THEMES: BookCoverTheme[] = [
  { bg: 'bg-category-brown', text: 'text-pastel-warm', border: 'border-category-red-dark', tagBg: 'bg-category-red-dark/40 text-pastel-warm/90', lineBg: 'bg-category-copper' },
  { bg: 'bg-wine-deepest', text: 'text-pastel-pink', border: 'border-wine-night', tagBg: 'bg-wine-night/40 text-pastel-pink/90', lineBg: 'bg-wine' },
  { bg: 'bg-category-purple-dark', text: 'text-pastel-purple', border: 'border-category-purple-night', tagBg: 'bg-category-purple-night/40 text-pastel-purple/90', lineBg: 'bg-category-purple' },
  { bg: 'bg-category-blue-dark', text: 'text-pastel-blue', border: 'border-category-blue-night', tagBg: 'bg-category-blue-night/40 text-pastel-blue/90', lineBg: 'bg-category-blue' },
  { bg: 'bg-warm-sand', text: 'text-earth-dark', border: 'border-sand-dark', tagBg: 'bg-earth-dark/15 text-earth-dark/95', lineBg: 'bg-gold' },
];

export function getBookCoverTheme(docId: string): BookCoverTheme {
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  return BOOK_COVER_THEMES[sum % BOOK_COVER_THEMES.length];
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}
