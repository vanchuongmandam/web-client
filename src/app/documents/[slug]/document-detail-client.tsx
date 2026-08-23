// src/app/documents/[slug]/document-detail-client.tsx

"use client";

import { toErrorMessage } from "@/lib/errors";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { checkDocumentOwnership, getDocumentDownload } from '@/lib/api';
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
  ShoppingBag,
  ShoppingCart,
  Sparkles,
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
import { Skeleton } from '@/components/ui/skeleton';
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

const getBookCoverTheme = (docId: string) => {
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  const themes = [
    { bg: 'bg-category-brown', text: 'text-pastel-warm', border: 'border-category-red-dark', tagBg: 'bg-category-red-dark/40 text-pastel-warm/90', lineBg: 'bg-category-copper' }, // Warm Mahogany
    { bg: 'bg-wine-deepest', text: 'text-pastel-pink', border: 'border-wine-night', tagBg: 'bg-wine-night/40 text-pastel-pink/90', lineBg: 'bg-wine' }, // Crimson Velvet / Wine Red
    { bg: 'bg-category-purple-dark', text: 'text-pastel-purple', border: 'border-category-purple-night', tagBg: 'bg-category-purple-night/40 text-pastel-purple/90', lineBg: 'bg-category-purple' }, // Dark Aubergine
    { bg: 'bg-category-blue-dark', text: 'text-pastel-blue', border: 'border-category-blue-night', tagBg: 'bg-category-blue-night/40 text-pastel-blue/90', lineBg: 'bg-category-blue' }, // Slate Ocean
    { bg: 'bg-warm-sand', text: 'text-earth-dark', border: 'border-sand-dark', tagBg: 'bg-earth-dark/15 text-earth-dark/95', lineBg: 'bg-gold' }, // Vintage Parchment & Gold
  ];
  return themes[sum % themes.length];
};

export function DocumentDetailClient({ document: doc }: Props) {
  const { token, hasHydrated } = useAuthStore();
  const bookmarked = useAuthStore((s) => s.bookmarkedDocumentIds.includes(doc._id));
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
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    // Chỉ check khi store đã hydrate xong
    if (!hasHydrated) return;

    if (token && doc._id) {
      checkDocumentOwnership(doc._id, token)
        .then((res) => setOwned(res.owned))
        .catch(() => setOwned(false))
        .finally(() => setChecking(false));
    } else {
      // Bây giờ chắc chắn user chưa đăng nhập
      setOwned(false);
      setChecking(false);
    }
  }, [token, doc._id, hasHydrated]);

  const handleBookmark = async () => {
    if (!token) return router.push('/login');
    setIsBookmarkLoading(true);
    try {
      const bookmarkedNow = await useAuthStore.getState().toggleBookmarkOptimistic(doc._id);
      toast({
        title: bookmarkedNow ? 'Đã lưu tài liệu' : 'Đã bỏ lưu tài liệu',
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
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8 bg-background font-sans w-full min-w-0">

      {/* Navigation & Breadcrumbs */}
      <div className="mb-6 sm:mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center w-full">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/documents" className="hover:text-primary transition-colors">Kho tài liệu</BreadcrumbLink>
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
          className="inline-flex items-center gap-2 rounded-md border-2 border-sand bg-warm-cream px-3.5 py-1.5 text-xs font-semibold text-earth-muted transition-colors hover:bg-sand/20 w-fit"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại kho
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid items-start gap-8 lg:grid-cols-12 w-full min-w-0">

        {/* Left main area (Document info & Tabs) */}
        <div className="w-full min-w-0 space-y-6 sm:space-y-8 lg:col-span-8">
          <Card className="w-full border-2 border-sand-light bg-warm-cream/70 rounded-xl overflow-hidden shadow-xs">
            <CardContent className="p-5 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-stretch w-full">

              {/* Left: Document Cover Frame */}
              <div className="w-full md:w-auto shrink-0 flex flex-col items-center justify-between">
                <div
                  className="relative aspect-[1/1.38] w-48 sm:w-52 md:w-56 overflow-hidden rounded-md border border-sand-light bg-white group cursor-pointer shadow-xs transition-transform duration-300 hover:border-sand"
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 backdrop-blur-xs">
                          <Eye className="size-3.5" /> Phóng to
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedImageIndex(0);
                      setIsLightboxOpen(true);
                    }}
                    className="mt-3 w-full max-w-[220px] h-8 text-xs font-medium border-sand bg-warm-cream hover:bg-sand/20 text-earth-muted gap-1.5 rounded-md transition-colors"
                  >
                    <Eye className="size-3.5 text-primary" />
                    <span>Xem trước ({allPreviewImages.length} ảnh)</span>
                  </Button>
                )}
              </div>

              {/* Right: Document Details & Metadata */}
              <div className="w-full flex-1 min-w-0 flex flex-col  gap-4">

                {/* Top: Category, Badges & Bookmark */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                      {doc.category && (
                        <Badge variant="outline" className="rounded-sm border-sand bg-warm-sand/40 text-earth-dark font-semibold text-xs px-2.5 py-0.5 max-w-full whitespace-normal break-words text-left leading-relaxed">
                          {doc.category.name}
                        </Badge>
                      )}
                      {doc.featured && (
                        <Badge variant="default" className="rounded-sm bg-primary hover:bg-wine-dark text-primary-foreground text-[11px] font-semibold px-2 py-0.5 flex items-center gap-1">
                          <Sparkles className="size-3" /> Đề cử
                        </Badge>
                      )}
                      <Badge variant="secondary" className="rounded-sm bg-sand/40 text-earth-muted text-[11px] font-medium px-2 py-0.5 border-0">
                        {doc.isFree ? 'Tài liệu mở' : 'Bản quyền'}
                      </Badge>
                    </div>

                    <Button
                      variant={bookmarked ? "default" : "outline"}
                      size="sm"
                      className={`shrink-0 h-8 px-2.5 text-xs gap-1.5 rounded-md border-sand font-medium transition-all ${bookmarked
                        ? "bg-primary hover:bg-wine-dark text-primary-foreground shadow-xs"
                        : "bg-warm-cream hover:bg-sand/20 text-earth-muted"
                        }`}
                      onClick={handleBookmark}
                      disabled={isBookmarkLoading}
                      title={bookmarked ? "Bỏ lưu tài liệu" : "Lưu vào bộ sưu tập"}
                    >
                      {isBookmarkLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : bookmarked ? (
                        <BookmarkCheck className="size-3.5 fill-current" />
                      ) : (
                        <Bookmark className="size-3.5" />
                      )}
                      <span className="hidden sm:inline">{bookmarked ? "Đã lưu" : "Lưu"}</span>
                    </Button>
                  </div>

                  {/* Main Title */}
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-earth break-words leading-snug">
                    {doc.title}
                  </h1>

                  {/* Author & Rating Line */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-earth-muted">
                    <span className="inline-flex items-center gap-1.5 font-medium bg-sand/25 px-2.5 py-1 rounded-md border border-sand-light/60">
                      <span>Tác giả: <strong className="text-earth font-semibold">{doc.author || 'Khuyết danh'}</strong></span>
                    </span>
                    {doc.rating?.average > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-900 border border-amber-300/40 px-2 py-1 rounded-md font-medium text-xs">
                        <Star className="size-3 fill-amber-500 text-amber-500" />
                        <strong>{doc.rating.average.toFixed(1)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Quick Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 rounded-lg border border-sand-light/80 bg-warm-ivory/60 p-3 text-xs text-earth-muted">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-earth-light/80">Định dạng</span>
                    <span className="font-bold text-earth font-mono text-xs">{doc.fileFormat.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-earth-light/80">Dung lượng</span>
                    <span className="font-semibold text-earth">
                      {doc.fileSize ? (doc.fileSize >= 1024 ? (doc.fileSize / 1024).toFixed(1) + ' MB' : doc.fileSize + ' KB') : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-earth-light/80">Số trang</span>
                    <span className="font-semibold text-earth">{doc.pageCount ? `${doc.pageCount} trang` : '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-earth-light/80">Lượt xem</span>
                    <span className="font-semibold text-earth flex items-center gap-1">
                      <Eye className="size-3 text-muted-foreground" />
                      {doc.viewCount || 0}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-earth-light/80">{doc.isFree ? 'Lượt nhận' : 'Lượt mua'}</span>
                    <span className="font-semibold text-earth flex items-center gap-1">
                      {doc.isFree ? (
                        <Download className="size-3 text-muted-foreground" />
                      ) : (
                        <ShoppingBag className="size-3 text-muted-foreground" />
                      )}
                      {doc.purchaseCount || 0}
                    </span>
                  </div>
                </div>

                {/* Bottom: Tags */}
                {doc.tags?.length ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Tag className="size-3.5 text-earth-lighter mr-1" />
                    {doc.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[11px] font-medium px-2 py-0.5 bg-sand/30 hover:bg-sand/50 text-earth-muted border-none rounded-sm transition-colors">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}

              </div>
            </CardContent>
          </Card>

          {/* Tab kẹp giấy Navigation panel */}
          <Tabs value={activeTab} onValueChange={setActiveTab} id="doc-tabs" className="w-full">
            <TabsList className="flex flex-nowrap w-full justify-start overflow-x-auto no-scrollbar bg-transparent border-b-2 border-sand h-auto p-0 gap-1 rounded-none">
              <TabsTrigger
                value="description"
                className="whitespace-nowrap shrink-0 rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-sand data-[state=active]:bg-warm-cream data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Mô tả chi tiết
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="whitespace-nowrap shrink-0 rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-sand data-[state=active]:bg-warm-cream data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Hình ảnh xem trước
              </TabsTrigger>
              <TabsTrigger
                value="meta"
                className="whitespace-nowrap shrink-0 rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-sand data-[state=active]:bg-warm-cream data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Thông tin kỹ thuật
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="whitespace-nowrap shrink-0 rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-sand data-[state=active]:bg-warm-cream data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
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
                    <span className="text-muted-foreground">{doc.isFree ? 'Lượt nhận / tải' : 'Lượt mua'}</span>
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
        <div className="w-full min-w-0 lg:col-span-4 lg:sticky lg:top-20">
          <Card className="w-full overflow-hidden border border-sand-light bg-warm-cream rounded-xl shadow-xs">
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
                <CardTitle className={`text-3xl font-extrabold tracking-tight ${doc.isFree ? 'text-primary' : 'text-category-red'}`}>
                  {formatPrice(doc.price)}
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] font-medium bg-sand/60 text-earth-muted rounded-full border-0 px-2.5 py-0.5">
                  {doc.isFree ? 'Tài liệu mở' : 'Sở hữu trọn đời'}
                </Badge>
              </div>

              <CardDescription className="text-xs text-earth-light flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                <span>Sở hữu vĩnh viễn, đọc online và tải file gốc</span>
              </CardDescription>
            </CardHeader>

            {/* Content: Actions & Details */}
            <CardContent className="space-y-5 p-5">
              {/* Primary & Secondary Action Buttons */}
              <div className="space-y-2.5">
                {!hasHydrated || checking ? (
                  <div className="space-y-2.5">
                    <Skeleton className="h-11 w-full rounded-md" />
                    <Skeleton className="h-11 w-full rounded-md" />
                  </div>
                ) : owned ? (
                  <>
                    <Button
                      asChild
                      className="w-full h-11 bg-primary hover:bg-wine-dark active:scale-[0.99] text-primary-foreground font-semibold text-sm rounded-md shadow-xs transition-all flex items-center justify-center gap-2"
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
                        className="w-full h-11 border border-sand bg-warm-cream hover:bg-warm-linen text-earth hover:text-primary font-semibold text-sm rounded-md shadow-xs transition-all flex items-center justify-center gap-2"
                        size="lg"
                        onClick={handleDownload}
                        disabled={downloading}
                      >
                        <Download className="size-4 text-primary" />
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
                    className="w-full h-12 bg-primary hover:bg-wine-dark active:scale-[0.99] text-primary-foreground font-semibold text-sm sm:text-base rounded-md shadow-xs transition-all flex items-center justify-center gap-2"
                    size="lg"
                    onClick={handleBuy}
                  >
                    <Download className="size-4.5" />
                    <span>Nhận miễn phí ngay</span>
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 bg-primary hover:bg-wine-dark active:scale-[0.99] text-primary-foreground font-semibold text-sm sm:text-base rounded-md shadow-xs transition-all flex items-center justify-center gap-2 group"
                    size="lg"
                    onClick={handleBuy}
                  >
                    <ShoppingCart className="size-4.5 transition-transform group-hover:scale-110" />
                    <span>Mua tác phẩm ngay</span>
                  </Button>
                )}

                {/* Preview Button */}
                {!owned && !checking && hasHydrated && allPreviewImages.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full h-11 border border-sand bg-warm-cream hover:bg-warm-linen text-earth hover:text-primary font-semibold text-sm rounded-md shadow-xs transition-all flex items-center justify-between px-3.5"
                    size="lg"
                    onClick={() => {
                      setActiveTab("preview");
                      const el = document.getElementById("doc-tabs");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="size-4 text-primary" />
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
                  <Badge variant={owned ? 'default' : 'secondary'} className={owned ? 'bg-primary text-primary-foreground font-medium rounded-full py-0.5' : 'bg-sand/60 text-earth-muted font-medium rounded-full border-0 py-0.5'}>
                    {!hasHydrated || checking ? 'Đang kiểm tra...' : owned ? 'Đã sở hữu' : 'Chưa sở hữu'}
                  </Badge>
                </div>
                <div className="h-[1px] bg-warm-sand/60" />
                <div className="flex items-center justify-between">
                  <span className="text-earth-light">{doc.isFree ? 'Lượt nhận / tải' : 'Lượt mua'}</span>
                  <span className="font-semibold text-earth">{doc.purchaseCount || 0} lượt</span>
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
                  <CheckCircle2 className="mt-0.5 size-3.5 text-primary shrink-0" />
                  <span>Mở khóa đọc online và tải file gốc ngay lập tức</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 text-primary shrink-0" />
                  <span>Lưu trữ vĩnh viễn trong tủ sách tài khoản của bạn</span>
                </div>
              </div>

              {/* Related Article Link */}
              {doc.relatedArticle ? (
                <Button asChild variant="outline" className="w-full h-9 border border-sand bg-warm-cream hover:bg-warm-linen text-earth hover:text-primary font-medium text-xs rounded-md">
                  <Link href={`/articles/${doc.relatedArticle.slug}`}>
                    <BookOpen className="mr-2 size-3.5 text-primary" />
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
