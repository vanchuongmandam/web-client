// src/app/documents/[slug]/document-detail-client.tsx

"use client";

import { toErrorMessage } from "@/lib/errors";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { checkDocumentOwnership, getDocumentDownload, toggleBookmark } from '@/lib/api';
import type { MarketDocument } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  FileBox,
  FileText,
  Scaling,
  ShoppingCart,
  Star,
  Tag,
  Bookmark,
  BookmarkCheck,
  Ban,
  Loader2,
  X
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import ReviewSection from '@/components/documents/ReviewSection';
import DocumentSuggestions from '@/components/documents/DocumentSuggestions';
import dynamic from 'next/dynamic';

function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const RichTextEditor = dynamic(() => import("@/components/ui/rich-text-editor"), {
  loading: () => <div className="animate-pulse bg-warm-cream h-40 rounded border border-sand" />,
  ssr: false
});

interface Props {
  document: MarketDocument;
  initialOwned?: boolean;
}

// Helper to determine book cover theme dynamically (identical to document-list-client)
const getBookCoverTheme = (docId: string) => {
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  const themes = [
    { bg: 'bg-category-brown', text: 'text-pastel-warm', border: 'border-category-red-dark', tagBg: 'bg-category-red-dark/40 text-pastel-warm/90', lineBg: 'bg-category-copper' }, // Warm Mahogany
    { bg: 'bg-forest-deepest', text: 'text-pastel-green', border: 'border-forest-night', tagBg: 'bg-forest-night/40 text-pastel-green/90', lineBg: 'bg-forest' }, // Forest Moss
    { bg: 'bg-category-purple-dark', text: 'text-pastel-purple', border: 'border-category-purple-night', tagBg: 'bg-category-purple-night/40 text-pastel-purple/90', lineBg: 'bg-category-purple' }, // Dark Aubergine
    { bg: 'bg-category-blue-dark', text: 'text-pastel-blue', border: 'border-category-blue-night', tagBg: 'bg-category-blue-night/40 text-pastel-blue/90', lineBg: 'bg-category-blue' }, // Slate Ocean
    { bg: 'bg-warm-sand', text: 'text-earth-dark', border: 'border-sand-dark', tagBg: 'bg-earth-dark/15 text-earth-dark/95', lineBg: 'bg-sand-muted' }, // Vintage Parchment
  ];
  return themes[sum % themes.length];
};

export function DocumentDetailClient({ document: doc }: Props) {
  const { user, token, refreshProfile } = useAuth();
  const router = useRouter();

  // Fallback chain: coverImage -> first previewImages -> previewFile (if image)
  const primaryCoverImage = doc.coverImage?.trim() ||
    (Array.isArray(doc.previewImages) && doc.previewImages.length > 0 ? doc.previewImages[0] : null) ||
    (doc.previewFile && typeof doc.previewFile === 'string' && doc.previewFile.trim() !== '' && !doc.previewFile.toLowerCase().endsWith('.pdf') && !doc.previewFile.toLowerCase().endsWith('.zip') && !doc.previewFile.toLowerCase().endsWith('.docx') ? doc.previewFile : null);

  // Combine coverImage, previewFile (if it's an image) and previewImages
  const allPreviewImages = Array.from(new Set([
    ...(doc.coverImage ? [doc.coverImage] : []),
    ...(Array.isArray(doc.previewImages) ? doc.previewImages : []),
    ...(doc.previewFile && typeof doc.previewFile === 'string' && doc.previewFile.trim() !== '' && !doc.previewFile.toLowerCase().endsWith('.pdf') && !doc.previewFile.toLowerCase().endsWith('.zip') && !doc.previewFile.toLowerCase().endsWith('.docx') ? [doc.previewFile] : [])
  ]));

  const { toast } = useToast();
  const [owned, setOwned] = useState(false);
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (user?.bookmarkedDocuments) {
      const isBookmarked = user.bookmarkedDocuments.some((b: string | MarketDocument) =>
        typeof b === 'string' ? b === doc._id : b._id === doc._id
      );
      setBookmarked(isBookmarked);
    }
  }, [user, doc._id]);

  useEffect(() => {
    if (token && doc._id) {
      checkDocumentOwnership(doc._id, token)
        .then((res) => setOwned(res.owned))
        .catch(() => setOwned(false))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [token, doc._id]);

  const handleBookmark = async () => {
    if (!token) return router.push('/login');
    setIsBookmarkLoading(true);
    try {
      const res = await toggleBookmark(doc._id, token);
      setBookmarked(res.bookmarked);
      refreshProfile(); // to update the user object context
      toast({
        title: res.bookmarked ? 'Đã lưu tài liệu' : 'Đã bỏ lưu tài liệu',
      });
    } catch (e) {
      toast({ title: 'Lỗi', description: toErrorMessage(e), variant: 'destructive' });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!token) return router.push('/login');
    setDownloading(true);
    try {
      const info = await getDocumentDownload(doc._id, token);
      window.open(info.downloadUrl, '_blank');
    } catch (err: unknown) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? toErrorMessage(err) : 'Không thể tải tài liệu',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleBuy = () => {
    if (!token) return router.push('/login');
    router.push(`/documents/${doc.slug}/checkout`);
  };

  const theme = getBookCoverTheme(doc._id);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 bg-background font-sans">

      {/* Navigation & Breadcrumbs */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/documents" className="hover:text-primary transition-colors">Tủ sách Tài liệu</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[220px] truncate font-semibold text-earth sm:max-w-xs">
                {doc.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href="/documents"
          className="inline-flex items-center gap-2 rounded-md border-2 border-sand bg-warm-cream px-3.5 py-1.5 text-xs font-semibold text-earth-muted transition-colors hover:bg-sand/20"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại kho
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid items-start gap-8 lg:grid-cols-12">

        {/* Left main area (Document info & Tabs) */}
        <div className="space-y-8 lg:col-span-8">
          <Card className="border-2 border-sand-light bg-warm-cream/70 rounded-xl overflow-hidden shadow-sm">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">

              {/* Left: Document Cover Frame */}
              <div className="w-full md:w-auto shrink-0 flex flex-col items-center">
                <div
                  className="relative aspect-[1/1.38] w-48 sm:w-56 md:w-60 overflow-hidden rounded-lg border border-sand-light bg-white group cursor-pointer"
                  onClick={() => {
                    if (allPreviewImages.length > 0) {
                      setSelectedImageIndex(0);
                      setIsLightboxOpen(true);
                    }
                  }}
                >
                  {primaryCoverImage ? (
                    <>
                      <img
                        src={primaryCoverImage}
                        alt={doc.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 backdrop-blur-xs">
                          <Eye className="w-3.5 h-3.5" /> Phóng to
                        </span>
                      </div>
                    </>
                  ) : (
                    // Mock 3D book cover for blank covers
                    <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-4 justify-between relative transition-transform duration-500 group-hover:scale-105`}>
                      {/* Crease shadow */}
                      <div className="absolute top-0 left-0 w-3.5 h-full bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10"></div>
                      <div className="absolute top-0 left-0.5 w-[0.5px] h-full bg-white/10 z-10"></div>

                      <div className="border border-current/15 rounded-md p-2 flex-1 flex flex-col justify-between items-center text-center relative">
                        <span className="text-[9px] uppercase tracking-[0.15em] font-semibold opacity-75 truncate max-w-full">
                          {doc.category?.name || 'VĂN CHƯƠNG'}
                        </span>

                        <div className="my-auto py-2">
                          <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-3 text-center px-1">
                            {doc.title}
                          </h3>
                          <div className="w-8 h-px bg-current opacity-35 mx-auto my-2 relative">
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rotate-45 bg-sand dark:bg-stone-900 border border-current"></div>
                          </div>
                          <p className="text-[10px] italic opacity-85 line-clamp-1">
                            {doc.author}
                          </p>
                        </div>

                        <div className="w-full flex items-center justify-between text-[8px] opacity-75 font-sans pt-1 border-t border-current/10">
                          <span>{doc.fileFormat.toUpperCase()}</span>
                          {doc.pageCount && <span>{doc.pageCount} TRANG</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {allPreviewImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(0);
                      setIsLightboxOpen(true);
                    }}
                    className="mt-3 text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem trước ({allPreviewImages.length} ảnh)
                  </button>
                )}
              </div>

              {/* Right: Document Details & Metadata */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">

                {/* Category & Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {doc.category && (
                    <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 border-sand">
                      {doc.category.name}
                    </Badge>
                  )}
                  {doc.featured && (
                    <Badge variant="default" className="text-xs font-semibold px-2.5 py-0.5">
                      Đề cử
                    </Badge>
                  )}
                  <Badge variant={doc.isFree ? "default" : "destructive"} className="text-xs font-semibold px-2.5 py-0.5">
                    {doc.isFree ? 'Miễn phí' : 'Có phí'}
                  </Badge>
                </div>

                {/* Main Title & Bookmark Button */}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-earth">
                    {doc.title}
                  </h1>
                  <Button
                    variant={bookmarked ? "default" : "outline"}
                    size="icon"
                    className="shrink-0 rounded-full border-sand hover:bg-sand/20 h-10 w-10"
                    onClick={handleBookmark}
                    disabled={isBookmarkLoading}
                    title={bookmarked ? "Bỏ lưu tài liệu" : "Lưu tài liệu"}
                  >
                    {isBookmarkLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : bookmarked ? (
                      <BookmarkCheck className="w-5 h-5 text-forest fill-forest" />
                    ) : (
                      <Bookmark className="w-5 h-5 text-earth-lighter" />
                    )}
                  </Button>
                </div>

                {/* Author & Stats Line */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-earth-muted">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="size-4 text-muted-foreground" />
                    <span>Tác giả: <strong className="text-foreground font-semibold">{doc.author || 'Khuyết danh'}</strong></span>
                  </div>

                  <span className="text-muted-foreground">•</span>

                  <div className="flex items-center gap-1.5">
                    <Eye className="size-4 text-muted-foreground" />
                    <span><strong className="text-foreground font-semibold">{doc.viewCount || 0}</strong> lượt xem</span>
                  </div>

                  {doc.purchaseCount !== undefined && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1.5">
                        <Download className="size-4 text-muted-foreground" />
                        <span><strong className="text-foreground font-semibold">{doc.purchaseCount}</strong> lượt tải</span>
                      </div>
                    </>
                  )}
                </div>

                {/* File Specs Mini Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="outline" className="border-sand bg-warm-cream text-earth-muted text-xs font-mono">
                    ĐỊNH DẠNG: {doc.fileFormat.toUpperCase()}
                  </Badge>
                  {doc.pageCount && (
                    <Badge variant="outline" className="border-sand bg-warm-cream text-earth-muted text-xs">
                      {doc.pageCount} trang
                    </Badge>
                  )}
                  {doc.fileSize && (
                    <Badge variant="outline" className="border-sand bg-warm-cream text-earth-muted text-xs">
                      {doc.fileSize >= 1024 ? (doc.fileSize / 1024).toFixed(1) + ' MB' : doc.fileSize + ' KB'}
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {doc.tags?.length ? (
                  <>
                    <Separator className="bg-warm-sand/60 my-1" />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag className="size-3.5 text-earth-lighter mr-1" />
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[11px] font-medium px-2.5 py-0.5 bg-sand/30 text-earth-muted border-none">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : null}

              </div>
            </CardContent>
          </Card>

          {/* Tab kẹp giấy Navigation panel */}
          <Tabs value={activeTab} onValueChange={setActiveTab} id="doc-tabs" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b-2 border-sand h-auto p-0 gap-1 rounded-none">
              <TabsTrigger
                value="description"
                className="rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-sand data-[state=active]:bg-warm-cream data-[state=active]:text-forest data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Mô tả chi tiết
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-sand data-[state=active]:bg-warm-cream data-[state=active]:text-forest data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Hình ảnh xem trước
              </TabsTrigger>
              <TabsTrigger
                value="meta"
                className="rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-sand data-[state=active]:bg-warm-cream data-[state=active]:text-forest data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Thông tin kỹ thuật
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-sand data-[state=active]:bg-warm-cream data-[state=active]:text-forest data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Nhận xét & Đánh giá
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4 focus-visible:outline-none">
              <Card className="border-2 border-sand-light bg-warm-cream/70 rounded-xl overflow-hidden shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-earth">Nội dung tóm tắt</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Giá trị sử dụng và tóm lược nội dung của ấn phẩm.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full text-earth-muted text-sm">
                    {doc.description ? (
                      <RichTextEditor
                        content={doc.description as unknown as Record<string, unknown>}
                        editable={false}
                        className="w-full overflow-hidden bg-transparent border-none p-0"
                      />
                    ) : (
                      <p>Tài liệu này chưa có mô tả chi tiết.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="mt-4 focus-visible:outline-none">
              <Card className="border-2 border-sand-light bg-warm-cream/70 rounded-xl overflow-hidden shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-earth">Hình ảnh xem trước</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Tham khảo các trang mẫu được trích xuất từ tài liệu.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allPreviewImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 rounded-lg overflow-hidden border-2 border-sand bg-sand/10 p-2">
                      {allPreviewImages.map((img, i) => (
                        <div
                          key={i}
                          className="relative aspect-[1/1.38] overflow-hidden cursor-pointer group rounded-md border bg-white shadow-xs"
                          onClick={() => {
                            setSelectedImageIndex(i);
                            setIsLightboxOpen(true);
                          }}
                        >
                          <img
                            src={img}
                            alt={`Trang xem trước ${i + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[11px] px-2 py-1 rounded-md font-medium">
                              Phóng to
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-6 text-center">Chưa có hình ảnh xem trước nào cho tài liệu này.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meta" className="mt-4 focus-visible:outline-none">
              <Card className="border-2 border-sand-light bg-warm-cream/70 rounded-xl overflow-hidden shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-earth">Thông số tệp tin</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Thông số kỹ thuật định dạng số của tài liệu.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs text-earth-muted">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Định dạng file</span>
                    <Badge variant="outline" className="border-sand uppercase font-bold text-[10px] rounded-md">{doc.fileFormat}</Badge>
                  </div>
                  {doc.pageCount !== undefined && doc.pageCount !== null ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Số trang</span>
                      <span className="font-semibold">{doc.pageCount} trang</span>
                    </div>
                  ) : null}
                  {doc.fileSize ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kích thước file</span>
                      <span className="font-semibold">{doc.fileSize >= 1024 ? (doc.fileSize / 1024).toFixed(2) + ' MB' : doc.fileSize + ' KB'}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lượt tải xuống</span>
                    <span className="font-semibold">{doc.purchaseCount || 0} lượt</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Điểm đánh giá</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                      <span className="font-semibold">
                        {doc.rating?.average > 0 ? doc.rating.average.toFixed(1) : 'Chưa có'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4 focus-visible:outline-none">
              <ReviewSection documentId={doc._id} price={doc.price} isFree={doc.isFree} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side (Payment CTA box) */}
        <div className="lg:col-span-4 lg:sticky lg:top-20">
          <Card className="overflow-hidden border border-sand-light bg-warm-cream rounded-xl shadow-xs">
            {/* Header: Pricing & Status */}
            <CardHeader className="border-b border-sand-light bg-warm-ivory/70 p-5 space-y-2">
              {doc.originalPrice && doc.originalPrice > doc.price ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-earth-lighter line-through font-medium">{formatPrice(doc.originalPrice)}</span>
                  <Badge variant="outline" className="text-[10px] font-semibold text-emerald-800 bg-emerald-500/10 border-emerald-300/60 py-0 px-1.5 rounded-sm">
                    Tiết kiệm {Math.round(((doc.originalPrice - doc.price) / doc.originalPrice) * 100)}%
                  </Badge>
                </div>
              ) : null}

              <div className="flex items-baseline justify-between gap-2">
                <CardTitle className={`text-3xl font-extrabold tracking-tight ${doc.isFree ? 'text-forest-bright' : 'text-category-red'}`}>
                  {formatPrice(doc.price)}
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] font-medium bg-sand/60 text-earth-muted rounded-full border-0 px-2.5 py-0.5">
                  {doc.isFree ? 'Tài liệu mở' : 'Bản quyền trọn đời'}
                </Badge>
              </div>

              <CardDescription className="text-xs text-earth-light flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="size-3.5 text-forest shrink-0" />
                <span>Sở hữu vĩnh viễn, đọc online và tải file gốc</span>
              </CardDescription>
            </CardHeader>

            {/* Content: Actions & Details */}
            <CardContent className="space-y-5 p-5">
              {/* Primary & Secondary Action Buttons */}
              <div className="space-y-2.5">
                {owned ? (
                  <>
                    <Button 
                      asChild 
                      className="w-full h-11 bg-forest hover:bg-forest-dark active:scale-[0.99] text-white font-semibold text-sm rounded-md shadow-xs transition-all flex items-center justify-center gap-2"
                      size="lg"
                    >
                      <Link href={`/documents/${doc.slug}/viewer`}>
                        <Eye className="size-4" />
                        <span>Đọc tài liệu online</span>
                      </Link>
                    </Button>
                    {doc.allowDownload !== false && (
                      <Button 
                        variant="outline" 
                        className="w-full h-11 border border-sand bg-warm-cream hover:bg-warm-linen text-earth hover:text-forest-dark font-semibold text-sm rounded-md shadow-xs transition-all flex items-center justify-center gap-2"
                        size="lg" 
                        onClick={handleDownload} 
                        disabled={downloading}
                      >
                        <Download className="size-4 text-forest" />
                        <span>{downloading ? 'Đang chuẩn bị file...' : 'Tải tài liệu gốc'}</span>
                      </Button>
                    )}
                    {doc.allowDownload === false && (
                      <p className="text-xs text-center text-muted-foreground pt-1 flex justify-center items-center gap-1.5">
                        <Ban className="size-3 text-red-600" /> Tài liệu được thiết lập chỉ đọc online
                      </p>
                    )}
                  </>
                ) : doc.isFree ? (
                  <Button
                    className="w-full h-12 bg-forest hover:bg-forest-dark active:scale-[0.99] text-white font-semibold text-sm sm:text-base rounded-md shadow-xs transition-all flex items-center justify-center gap-2"
                    size="lg"
                    onClick={handleBuy}
                  >
                    <Download className="size-4.5" />
                    <span>Nhận miễn phí ngay</span>
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-12 bg-forest hover:bg-forest-dark active:scale-[0.99] text-white font-semibold text-sm sm:text-base rounded-md shadow-xs transition-all flex items-center justify-center gap-2 group" 
                    size="lg" 
                    onClick={handleBuy}
                  >
                    <ShoppingCart className="size-4.5 transition-transform group-hover:scale-110" />
                    <span>Mua tác phẩm ngay</span>
                  </Button>
                )}

                {/* Preview Button */}
                {!owned && allPreviewImages.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full h-11 border border-sand bg-warm-cream hover:bg-warm-linen text-earth hover:text-forest-dark font-semibold text-sm rounded-md shadow-xs transition-all flex items-center justify-between px-3.5"
                    size="lg"
                    onClick={() => {
                      setActiveTab("preview");
                      const el = document.getElementById("doc-tabs");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="size-4 text-forest" />
                      <span>Xem trước hình ảnh</span>
                    </span>
                    <span className="text-[11px] font-medium bg-sand/70 text-earth-muted px-2.5 py-0.5 rounded-full">
                      {allPreviewImages.length} ảnh
                    </span>
                  </Button>
                )}
              </div>

              {/* Specs & Metadata Breakdown */}
              <div className="space-y-2 rounded-lg border border-sand-light bg-warm-ivory/40 p-3.5 text-xs text-earth-muted">
                <div className="flex items-center justify-between">
                  <span className="text-earth-light">Tình trạng</span>
                  <Badge variant={owned ? 'default' : 'secondary'} className={owned ? 'bg-forest text-white font-medium rounded-full py-0.5' : 'bg-sand/60 text-earth-muted font-medium rounded-full border-0 py-0.5'}>
                    {checking ? 'Đang kiểm tra...' : owned ? 'Đã sở hữu' : 'Chưa sở hữu'}
                  </Badge>
                </div>
                <div className="h-[1px] bg-warm-sand/60" />
                <div className="flex items-center justify-between">
                  <span className="text-earth-light">Lượt tải</span>
                  <span className="font-semibold text-earth">{doc.purchaseCount || 0} bản</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-earth-light">Lượt xem</span>
                  <span className="font-semibold text-earth">{doc.viewCount || 0} lượt</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-earth-light">Đánh giá trung bình</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-earth">
                    <Star className="size-3 fill-gold text-gold" />
                    {doc.rating?.average > 0 ? doc.rating.average.toFixed(1) : 'Chưa có'}
                  </span>
                </div>
              </div>

              {/* Ownership Guarantees */}
              <div className="space-y-2 rounded-lg border border-sand-light/60 bg-warm-cream p-3.5 text-xs text-earth-muted">
                <p className="font-semibold text-earth text-[11px] uppercase tracking-wider">Quyền lợi khi sở hữu</p>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 text-forest shrink-0" />
                  <span>Mở khóa đọc online và tải file gốc ngay lập tức</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 text-forest shrink-0" />
                  <span>Lưu trữ vĩnh viễn trong tủ sách tài khoản của bạn</span>
                </div>
              </div>

              {/* Related Article Link */}
              {doc.relatedArticle ? (
                <Button asChild variant="outline" className="w-full h-9 border border-sand bg-warm-cream hover:bg-warm-linen text-earth hover:text-forest-dark font-medium text-xs rounded-md">
                  <Link href={`/articles/${doc.relatedArticle.slug}`}>
                    <BookOpen className="mr-2 size-3.5 text-forest" />
                    Xem bài phân tích đính kèm
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Suggestions Section */}
      <DocumentSuggestions documentId={doc._id} />

      {/* Lightbox Preview Images */}
      <ImageLightbox
        items={allPreviewImages}
        initialIndex={selectedImageIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        title={`Bản xem trước: ${doc.title}`}
      />
    </div>
  );
}
