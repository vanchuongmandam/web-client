// src/lib/types.ts

// Định nghĩa cho một file media (ảnh hoặc video)
export interface Media {
  url: string;
  mediaType: 'image' | 'video' | 'pdf';
  caption?: string;
}

// Định nghĩa cho một bình luận
export interface Comment {
  _id: string;
  articleId: string;
  author: {
    _id: string;
    username: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa cho một danh mục (ĐÃ SỬA: Thêm 'children')
export interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string; // ID của danh mục cha
  children: Category[]; // Mảng chứa các danh mục con
}

// Định nghĩa cho một bài viết
export interface Article {
  _id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: Category; // Vẫn là một object Category
  excerpt: string;
  // Updated content to be a JSON object
  content: Record<string, any>;
  media: Media[];
  trending: boolean;
  createdAt: string;
  updatedAt: string;
}
