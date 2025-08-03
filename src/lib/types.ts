export interface Article {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  imageHint: string;
  trending?: boolean;
}

export interface Book {
  id:string;
  title: string;
  author: string;
  imageUrl: string;
  imageHint: string;
}
