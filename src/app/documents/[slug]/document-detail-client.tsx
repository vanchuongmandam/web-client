// src/app/documents/[slug]/document-detail-client.tsx
"use client";

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
  Loader2
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
import ReviewSection from '@/components/documents/ReviewSection';
import DocumentSuggestions from '@/components/documents/DocumentSuggestions';

function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

interface Props {
  document: MarketDocument;
}

// Helper to determine book cover theme dynamically (identical to document-list-client)
const getBookCoverTheme = (docId: string) => {
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  const themes = [
    { bg: 'bg-[#5c3e35]', text: 'text-[#f4eae1]', border: 'border-[#432d27]', tagBg: 'bg-[#432d27]/40 text-[#f4eae1]/90', lineBg: 'bg-[#a37055]' }, // Warm Mahogany
    { bg: 'bg-[#2b3a32]', text: 'text-[#e9f1e8]', border: 'border-[#1d2722]', tagBg: 'bg-[#1d2722]/40 text-[#e9f1e8]/90', lineBg: 'bg-[#526f5c]' }, // Forest Moss
    { bg: 'bg-[#3b2b3a]', text: 'text-[#f5eaf4]', border: 'border-[#261c25]', tagBg: 'bg-[#261c25]/40 text-[#f5eaf4]/90', lineBg: 'bg-[#7a5879]' }, // Dark Aubergine
    { bg: 'bg-[#1f2d3d]', text: 'text-[#e9f1f6]', border: 'border-[#131b25]', tagBg: 'bg-[#131b25]/40 text-[#e9f1f6]/90', lineBg: 'bg-[#4f6b8c]' }, // Slate Ocean
    { bg: 'bg-[#e2d6c5]', text: 'text-[#3e342a]', border: 'border-[#ccbfae]', tagBg: 'bg-[#3e342a]/15 text-[#3e342a]/95', lineBg: 'bg-[#bca68d]' }, // Vintage Parchment
  ];
  return themes[sum % themes.length];
};

export function DocumentDetailClient({ document: doc }: Props) {
  const { user, token, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [owned, setOwned] = useState(false);
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  useEffect(() => {
    if (user?.bookmarkedDocuments) {
      const isBookmarked = user.bookmarkedDocuments.some((b: any) => 
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
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
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
        description: err instanceof Error ? err.message : 'Không thể tải tài liệu',
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
              <BreadcrumbPage className="max-w-[220px] truncate font-semibold text-[#483d31] sm:max-w-xs">
                {doc.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href="/documents"
          className="inline-flex items-center gap-2 rounded-md border-2 border-[#ebdcb9] bg-[#fcf9f2] px-3.5 py-1.5 text-xs font-semibold text-[#635748] transition-colors hover:bg-[#ebdcb9]/20"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại kho
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid items-start gap-8 lg:grid-cols-12">
        
        {/* Left main area (Document info & Tabs) */}
        <div className="space-y-8 lg:col-span-8">
          <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 rounded-md overflow-hidden shadow-sm">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[250px_1fr] items-start">
              
              {/* Document cover container */}
              <div className="w-full flex justify-center">
                {doc.previewImages && doc.previewImages.length > 0 ? (
                  // Flat display for actual uploaded preview covers
                  <div className="relative aspect-[1/1.38] w-full max-w-[220px] overflow-hidden rounded-md border-2 border-[#ebdcb9] bg-[#fcf9f2] p-1.5 shadow-md">
                    <img
                      src={doc.previewImages[0]}
                      alt={doc.title}
                      className="h-full w-full rounded-md object-cover"
                    />
                    <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                      {doc.featured && <Badge className="bg-[#4c6b54] text-white hover:bg-[#4c6b54] text-[9px] font-bold px-1.5 py-0.5">Nổi bật</Badge>}
                      {doc.category && <Badge variant="secondary" className="bg-[#fcf9f2]/90 text-foreground border border-[#ebdcb9] text-[9px] font-medium px-1.5 py-0.5">{doc.category.name}</Badge>}
                    </div>
                  </div>
                ) : (
                  // Mock 3D book cover for blank covers
                  <div className="relative aspect-[1/1.38] w-full max-w-[220px] overflow-hidden rounded-md shadow-[5px_5px_15px_rgba(0,0,0,0.15),-1px_0px_2px_rgba(0,0,0,0.08)] border border-[#2d2d2d]/10">
                    <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-4 justify-between relative`}>
                      {/* Crease shadow */}
                      <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10"></div>
                      <div className="absolute top-0 left-0.5 w-[0.5px] h-full bg-white/10 z-10"></div>
                      
                      <div className="border border-current/15 rounded p-2 flex-1 flex flex-col justify-between items-center text-center relative">
                        <span className="text-[8px] uppercase tracking-[0.15em] font-semibold opacity-75 truncate max-w-full">
                          {doc.category?.name || 'VĂN CHƯƠNG'}
                        </span>
                        
                        <div className="my-auto py-2">
                          <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-3 text-center px-1">
                            {doc.title}
                          </h3>
                          <div className="w-8 h-px bg-current opacity-35 mx-auto my-2 relative">
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rotate-45 bg-[#ebdcb9] dark:bg-stone-900 border border-current"></div>
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
                  </div>
                )}
              </div>

              {/* Main text metadata */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold leading-snug text-[#483d31] md:text-3xl">
                    {doc.title}
                  </h1>
                  <Button 
                    variant={bookmarked ? "default" : "outline"} 
                    size="icon" 
                    className="shrink-0 rounded-full border-[#ebdcb9] hover:bg-[#ebdcb9]/20"
                    onClick={handleBookmark}
                    disabled={isBookmarkLoading}
                    title={bookmarked ? "Bỏ lưu tài liệu" : "Lưu tài liệu"}
                  >
                    {isBookmarkLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : bookmarked ? (
                      <BookmarkCheck className="w-4.5 h-4.5 text-[#4c6b54] fill-[#4c6b54]" />
                    ) : (
                      <Bookmark className="w-4.5 h-4.5 text-[#8c7e6c]" />
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline" className="border-[#ebdcb9] text-[#635748] bg-[#fcf9f2]/40">
                    <BookOpen className="mr-1.5 size-3.5 text-muted-foreground" />
                    Tác giả: {doc.author || 'Khuyết danh'}
                  </Badge>
                  <Badge variant="outline" className="border-[#ebdcb9] text-[#635748] bg-[#fcf9f2]/40">
                    <Eye className="mr-1.5 size-3.5 text-muted-foreground" />
                    {doc.viewCount || 0} lượt xem
                  </Badge>
                  <Badge variant="outline" className="border-[#ebdcb9] text-[#635748] bg-[#fcf9f2]/40 uppercase">
                    {doc.fileFormat}
                  </Badge>
                  <Badge className={doc.isFree ? "bg-[#ebf4ef] text-[#2d5c41] hover:bg-[#ebf4ef]" : "bg-[#f9ebeb] text-[#8e2929] hover:bg-[#f9ebeb]"}>
                    {doc.isFree ? 'Miễn phí' : 'Có phí'}
                  </Badge>
                </div>

                {doc.tags?.length ? (
                  <>
                    <Separator className="bg-[#e6dfd3]/60" />
                    <div className="flex flex-wrap gap-1.5">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-[#ebdcb9]/20 text-[#635748] border-none text-[11px] font-medium px-2.5 py-0.5">
                          <Tag className="mr-1 size-3 text-[#8c7e6c]" />
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
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b-2 border-[#ebdcb9] h-auto p-0 gap-1 rounded-none">
              <TabsTrigger 
                value="description"
                className="rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-[#ebdcb9] data-[state=active]:bg-[#fcf9f2] data-[state=active]:text-[#4c6b54] data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Mô tả chi tiết
              </TabsTrigger>
              <TabsTrigger 
                value="preview"
                className="rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-[#ebdcb9] data-[state=active]:bg-[#fcf9f2] data-[state=active]:text-[#4c6b54] data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Hình ảnh xem trước
              </TabsTrigger>
              <TabsTrigger 
                value="meta"
                className="rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-[#ebdcb9] data-[state=active]:bg-[#fcf9f2] data-[state=active]:text-[#4c6b54] data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Thông tin kỹ thuật
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="rounded-t-md border-x-2 border-t-2 border-transparent data-[state=active]:border-[#ebdcb9] data-[state=active]:bg-[#fcf9f2] data-[state=active]:text-[#4c6b54] data-[state=active]:shadow-none px-4 py-2 text-xs md:text-sm font-bold transition-all rounded-b-none hover:text-primary"
              >
                Nhận xét & Đánh giá
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-4 focus-visible:outline-none">
              <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 rounded-md overflow-hidden shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-[#483d31]">Nội dung tóm tắt</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Giá trị sử dụng và tóm lược nội dung của ấn phẩm.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line leading-relaxed text-[#5a5045] text-sm">
                    {(() => {
                      if (!doc.description) return 'Tài liệu này chưa có mô tả chi tiết.';
                      if (typeof doc.description === 'string') return doc.description;
                      
                      // Handle TipTap JSON format
                      try {
                        const extractText = (node: any): string => {
                          if (node.type === 'text') return node.text || '';
                          if (node.content && Array.isArray(node.content)) {
                            const childrenText = node.content.map(extractText).join('');
                            return node.type === 'paragraph' ? childrenText + '\n' : childrenText;
                          }
                          return '';
                        };
                        return extractText(doc.description) || 'Tài liệu này chưa có mô tả chi tiết.';
                      } catch (e) {
                        return JSON.stringify(doc.description);
                      }
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preview" className="mt-4 focus-visible:outline-none">
              <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 rounded-md overflow-hidden shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-[#483d31]">Trang xem trước bổ sung</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Tham khảo một phần nội dung trước khi đưa vào tủ sách.</CardDescription>
                </CardHeader>
                <CardContent>
                  {doc.previewImages && doc.previewImages.length > 1 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {doc.previewImages.slice(1).map((img, i) => (
                        <div key={i} className="aspect-[1/1.38] overflow-hidden rounded-md border border-[#ebdcb9] bg-card p-1 shadow-sm">
                          <img
                            src={img}
                            alt={`Preview ${i + 2}`}
                            className="h-full w-full rounded-md object-cover transition-transform hover:scale-105 duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Chưa có trang xem trước bổ sung nào cho tài liệu này.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="meta" className="mt-4 focus-visible:outline-none">
              <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 rounded-md overflow-hidden shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-[#483d31]">Thông số tệp tin</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Thông số kỹ thuật định dạng số của tài liệu.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs text-[#5a5045]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Định dạng file</span>
                    <Badge variant="outline" className="border-[#ebdcb9] uppercase font-bold text-[10px]">{doc.fileFormat}</Badge>
                  </div>
                  {doc.pageCount ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Số trang</span>
                      <span className="font-semibold">{doc.pageCount} trang</span>
                    </div>
                  ) : null}
                  {doc.fileSize ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kích thước file</span>
                      <span className="font-semibold">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lượt tải xuống</span>
                    <span className="font-semibold">{doc.purchaseCount || 0} lượt</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Điểm đánh giá</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-[#cbb685] text-[#cbb685]" />
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
          <Card className="overflow-hidden border-2 border-[#e6dfd3] bg-[#fcf9f2] rounded-md shadow-sm">
            <CardHeader className="border-b border-[#e6dfd3] bg-gradient-to-br from-[#f6ecd9] to-[#ebdcb9]/40 p-5">
              {doc.originalPrice && doc.originalPrice > doc.price ? (
                <p className="text-xs text-muted-foreground line-through font-medium">{formatPrice(doc.originalPrice)}</p>
              ) : null}
              <CardTitle className={`text-3xl font-black ${doc.isFree ? 'text-[#3c6b41]' : 'text-[#8e2929]'}`}>
                {formatPrice(doc.price)}
              </CardTitle>
              <CardDescription className="text-xs text-[#7e7363] mt-1">Sở hữu vĩnh viễn, đọc online và tải file gốc không giới hạn.</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 p-5">
              {owned ? (
                <div className="space-y-3">
                  <Button asChild className="w-full bg-[#4c6b54] hover:bg-[#3b5341] text-[#f7eaf0] font-bold" size="lg">
                    <Link href={`/documents/${doc.slug}/viewer`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Đọc Online bảo mật
                    </Link>
                  </Button>
                  {doc.allowDownload !== false && (
                    <Button variant="outline" className="w-full border-2 border-[#ebdcb9] hover:bg-[#ebdcb9]/20 font-bold" size="lg" onClick={handleDownload} disabled={downloading}>
                      <Download className="mr-2 h-4 w-4 text-[#8c7e6c]" />
                      {downloading ? 'Đang chuẩn bị...' : 'Tải tài liệu gốc'}
                    </Button>
                  )}
                  {doc.allowDownload === false && (
                    <p className="text-xs text-center text-muted-foreground pt-1 flex justify-center items-center gap-1.5">
                      <Ban className="size-3 text-red-600" /> Tài liệu được thiết lập chỉ đọc online
                    </p>
                  )}
                </div>
              ) : doc.isFree ? (
                <Button
                  className="w-full bg-[#4c6b54] text-[#f7eaf0] hover:bg-[#3b5341] font-bold"
                  size="lg"
                  onClick={handleBuy}
                >
                  <Download className="mr-2 size-4" />
                  Nhận miễn phí
                </Button>
              ) : (
                <Button className="w-full bg-[#4c6b54] text-[#f7eaf0] hover:bg-[#3b5341] font-bold" size="lg" onClick={handleBuy}>
                  <ShoppingCart className="mr-2 size-4" />
                  Mua tác phẩm ngay
                </Button>
              )}

              {/* Specs checklist */}
              <div className="space-y-3 rounded-md border-2 border-[#ebdcb9]/50 bg-[#ebdcb9]/10 p-4 text-xs text-[#5a5045]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tình trạng sở hữu</span>
                  <Badge variant={owned ? 'default' : 'secondary'} className={owned ? 'bg-[#4c6b54] text-[#f7eaf0]' : 'bg-[#e6dfd3]/50 text-[#635748]'}>
                    {checking ? 'Đang kiểm tra...' : owned ? 'Đã sở hữu' : 'Chưa sở hữu'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lượt tải</span>
                  <span className="font-semibold">{doc.purchaseCount || 0} bản</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lượt xem</span>
                  <span className="font-semibold">{doc.viewCount || 0} lượt</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đánh giá trung bình</span>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Star className="h-3 w-3 fill-[#cbb685] text-[#cbb685]" />
                    {doc.rating?.average > 0 ? doc.rating.average.toFixed(1) : 'Chưa có'}
                  </span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="space-y-2.5 rounded-md border-2 border-[#ebdcb9]/30 p-4 text-xs text-[#6e6353]">
                <p className="font-bold text-[#483d31]">Quyền lợi sau mua</p>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 text-[#4c6b54] shrink-0" />
                  <span>Mở khóa đọc online và tải xuống ngay lập tức.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 text-[#4c6b54] shrink-0" />
                  <span>Lịch sử và tệp tin gốc lưu trữ an toàn trong tài khoản của bạn.</span>
                </div>
              </div>

              {doc.relatedArticle ? (
                <Button asChild variant="outline" className="w-full border-2 border-[#ebdcb9] hover:bg-[#ebdcb9]/20 font-bold text-xs">
                  <Link href={`/articles/${doc.relatedArticle.slug}`}>
                    <BookOpen className="mr-2 size-3.5 text-[#8c7e6c]" />
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
    </div>
  );
}
