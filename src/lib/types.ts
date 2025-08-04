// src/lib/types.ts

// Định nghĩa cấu trúc cho Category dựa trên API
export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Article {
  _id: string;
  id?: string; // id có thể không có nếu chỉ dùng _id
  slug: string;
  title: string;
  author: string;
  date: string;
  category: Category;
  excerpt: string;
  content: string;
  imageUrl: string;
  imageHint?: string;
  trending?: boolean;
}

export interface Book {
  id:string;
  title: string;
  author: string;
  imageUrl: string;
  imageHint: string;
}

// --- Thêm kiểu dữ liệu cho Bình luận và Người dùng ---
export interface User {
  _id: string;
  username: string;
  role: string;
}

// Đại diện cho một bình luận từ API
export interface Comment {
  _id: string;
  content: string;
  author: User;
  article: string; // articleId
  parentComment?: string | null;
  createdAt: string;
  // Frontend sẽ tự xây dựng cây bình luận từ danh sách phẳng
  children?: Comment[]; 
}
