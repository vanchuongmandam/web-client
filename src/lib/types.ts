// src/lib/types.ts

export interface Media {
  url: string;
  mediaType: 'image' | 'video' | 'pdf';
  caption?: string;
  isRestricted?: boolean;
  accessGranted?: boolean;
  requestStatus?: "pending" | "approved" | "rejected" | null;
  unlockPrice?: number;
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
  relatedDocuments?: MarketDocument[];
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

export interface BankInfo {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface SocialLinks {
  facebook?: string;
  website?: string;
  github?: string;
}

export interface SecurityStatus {
  twoFactorEnabled: boolean;
  passkeysEnabled: boolean;
  securityLevel: 'standard' | 'high';
}

export interface UserProfile {
  _id: string;
  username: string;
  role: string;
  displayName?: string;
  penName?: string;
  email?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  phone?: string;
  workPlace?: string;
  billingAddress?: BillingAddress;
  preferences?: {
    fontSize?: 'small' | 'medium' | 'large';
    theme?: 'light' | 'dark' | 'sepia';
  };
  purchaseCount?: number;
  totalSpent?: number;
  balance?: number;
  bankInfo?: BankInfo;
  socialLinks?: SocialLinks;
  securityStatus?: SecurityStatus;
  subRole?: 'student' | 'teacher' | 'author' | 'reader';
  bookmarkedDocuments?: MarketDocument[] | string[];
  isOAuth?: boolean;
  isEmailVerified?: boolean;
  googleId?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  _id: string;
  username: string;
  displayName?: string;
  penName?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  subRole?: string;
  createdAt: string;
  stats: {
    totalReviewsLeft: number;
    totalPublishedDocs: number;
    totalDocuments?: number;
    totalViews?: number;
    averageRating?: number;
  };
  documents?: MarketDocument[];
}

export interface Review {
  _id: string;
  document: string;
  user: {
    _id: string;
    displayName?: string;
    username: string;
    avatar?: string;
  };
  rating: number;
  content: string;
  isVerifiedPurchase: boolean;
  upvotes: string[];
  upvoteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentCategory {
  _id: string;
  name: string;
  slug: string;
  parent?: string;
  children?: DocumentCategory[];
}

export interface DocumentCollection {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface MarketDocument {
  _id: string;
  title: string;
  slug: string;
  description: string;
  author: string;
  category: DocumentCategory;
  collections?: DocumentCollection[];
  tags: string[];
  price: number;
  originalPrice?: number;
  isFree: boolean;
  previewImages: string[];
  fullFile?: string;
  previewFile?: string;
  coverImage?: string;
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
  allowDownload?: boolean;
  relatedArticle?: { _id: string; title: string; slug: string };
  relatedDocuments?: MarketDocument[];
  uploader?: string;
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
  paymentMethod?: 'sepay' | 'wallet';
  couponCode?: string;
  discountAmount?: number;
  orderType?: 'purchase' | 'deposit';
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

export interface AdminTopDocument {
  documentId: string;
  title: string;
  slug: string;
  purchaseCount: number;
  revenue: number;
}

export interface AdminDashboardStats {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    totalDocuments: number;
    totalDownloads: number;
    cancelledOrders: number;
    refundedOrders: number;
    totalUsers: number;
    newUsersThisMonth: number;
  };
  deltas: {
    revenueMoM: number;
    ordersMoM: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  activityByMonth: Array<{
    month: string;
    orders: number;
    purchases: number;
  }>;
  topDocuments: AdminTopDocument[];
  revenueByPaymentMethod: Record<string, { revenue: number; count: number }>;
  couponStats: CouponStat[];
  recentOrders: Array<{
    _id: string;
    orderCode: string;
    user: { _id: string; username: string; email?: string };
    totalAmount: number;
    discountAmount?: number;
    couponCode?: string;
    status: string;
    orderType: 'purchase' | 'deposit';
    paymentMethod: 'sepay' | 'wallet';
    createdAt: string;
  }>;
  recentUsers: Array<{
    _id: string;
    username: string;
    email: string;
    role: string;
    isOAuth: boolean;
    createdAt: string;
  }>;
  pendingAccessRequests: number;
  orderStatusBreakdown: Record<string, number>;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponStat {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usedCount: number;
  maxUses: number | null;
  isActive: boolean;
  expiresAt: string;
  totalDiscount: number;
}

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  balance: number;
  isEmailVerified: boolean;
  isOAuth: boolean;
  createdAt: string;
  updatedAt: string;
}
