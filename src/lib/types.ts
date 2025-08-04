// src/lib/types.ts

// Định nghĩa cấu trúc cho Category dựa trên API
export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Article {
  _id: string;      // API trả về _id
  id: string;       // Giữ lại id để tương thích nếu cần
  slug: string;
  title: string;
  author: string;
  date: string;
  category: Category; // Thay đổi từ string thành object Category
  excerpt: string;
  content: string;
  imageUrl: string;
  imageHint?: string; // imageHint có thể không có
  trending?: boolean;
}

export interface Book {
  id:string;
  title: string;
  author: string;
  imageUrl: string;
  imageHint: string;
}
