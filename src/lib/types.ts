// src/lib/types.ts

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

// Cấu trúc cho một media item trong bài viết
export interface Media {
  url: string;
  mediaType: 'image' | 'video';
  caption?: string;
}

export interface Article {
  _id: string;
  id?: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: Category;
  excerpt: string;
  content: string;
  media: Media[]; // Thay thế imageUrl bằng mảng media
  trending?: boolean;
}

export interface Book {
  id:string;
  title: string;
  author: string;
  imageUrl: string;
  imageHint: string;
}

export interface User {
  _id: string;
  username:string;
  role: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: User;
  article: string;
  parentComment?: string | null;
  createdAt: string;
  children?: Comment[]; 
}
