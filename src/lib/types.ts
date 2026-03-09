// src/lib/types.ts

export interface Media {
  url: string;
  mediaType: 'image' | 'video' | 'pdf';
  caption?: string;
  isRestricted?: boolean;
  accessGranted?: boolean;
  requestStatus?: "pending" | "approved" | "rejected" | null;
}

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

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string;
  children: Category[];
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapContent {
  type: 'doc';
  content: TiptapNode[];
}

export interface Article {
  _id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: Category;
  excerpt: string;
  content: TiptapContent;
  media: Media[];
  trending: boolean;
  createdAt: string;
  updatedAt: string;
}
