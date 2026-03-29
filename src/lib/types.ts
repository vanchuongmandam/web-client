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

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Marketplace Types
// ---------------------------------------------------------------------------

export interface BillingAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  role: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  billingAddress?: BillingAddress;
  preferences?: {
    fontSize?: 'small' | 'medium' | 'large';
    theme?: 'light' | 'dark' | 'sepia';
  };
  purchaseCount?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketDocument {
  _id: string;
  title: string;
  slug: string;
  description: string;
  author: string;
  category: Category;
  tags: string[];
  price: number;
  originalPrice?: number;
  isFree: boolean;
  previewImages: string[];
  previewFile?: string;
  fileFormat: 'pdf' | 'docx' | 'zip';
  fileSize?: number;
  pageCount?: number;
  purchaseCount: number;
  viewCount: number;
  rating: {
    average: number;
    count: number;
  };
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  relatedArticle?: { _id: string; title: string; slug: string };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  document: string | MarketDocument;
  price: number;
  title: string;
}

export interface Order {
  _id: string;
  orderCode: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  billingAddress: BillingAddress;
  transferContent: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  qrCodeUrl: string;
  status: 'pending' | 'paid' | 'confirmed' | 'cancelled' | 'expired' | 'refunded';
  paidAt?: string;
  paidAmount?: number;
  expiresAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  _id: string;
  user: string;
  document: MarketDocument;
  order: string;
  price: number;
  downloadCount: number;
  lastDownloadAt?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}
