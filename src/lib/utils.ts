import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hàm tạo slug tự động, xử lý tiếng Việt
export const generateSlug = (name: string): string => {
  if (!name) return '';
  
  // Chuyển đổi chuỗi thành dạng chuẩn NFD (Normalization Form Decomposed)
  // và loại bỏ các dấu thanh (diacritics)
  const nonAccentVietnamese = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');

  return nonAccentVietnamese
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ các ký tự đặc biệt không phải chữ, số, khoảng trắng hoặc gạch ngang
    .trim() // Xóa khoảng trắng đầu và cuối
    .replace(/\s+/g, '-') // Thay thế một hoặc nhiều khoảng trắng bằng một gạch ngang
    .replace(/-+/g, '-'); // Thay thế một hoặc nhiều gạch ngang bằng một gạch ngang
};
