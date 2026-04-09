// src/app/documents/[slug]/document-detail-client.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  ShoppingCart,
  Star,
  Tag,
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

function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

interface Props {
  document: MarketDocument;
}

export function DocumentDetailClient({ document: doc }: Props) {
  const { token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [owned, setOwned] = useState(false);
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);

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

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/documents">Kho Tài liệu</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[220px] truncate font-semibold text-primary sm:max-w-xs">
                {doc.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href="/documents"
          className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft />
          Quay lại kho
        </Link>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardContent className="grid gap-6 p-6 md:grid-cols-[280px_1fr]">
              <div>
                {doc.previewImages && doc.previewImages.length > 0 ? (
                  <div className="relative aspect-[1/1.41] overflow-hidden rounded-xl border bg-card p-2">
                    <img
                      src={doc.previewImages[0]}
                      alt={doc.title}
                      className="h-full w-full rounded-md object-cover"
                    />
                    <div className="absolute left-4 top-4 flex flex-col gap-2">
                      {doc.featured ? <Badge>Nổi bật</Badge> : null}
                      {doc.category ? <Badge variant="secondary">{doc.category.name}</Badge> : null}
                    </div>
                  </div>
                ) : (
                  <div className="relative flex aspect-[1/1.41] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-6 text-center text-muted-foreground">
                    <FileText className="mb-4 h-16 w-16 opacity-40" />
                    <span className="text-sm font-semibold uppercase tracking-wider opacity-60">Cover trống</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-black leading-tight text-primary md:text-4xl">{doc.title}</h1>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    <BookOpen data-icon="inline-start" />
                    {doc.author || 'Khuyết danh'}
                  </Badge>
                  <Badge variant="outline">
                    <Eye data-icon="inline-start" />
                    {doc.viewCount || 0} lượt xem
                  </Badge>
                  <Badge variant="outline">{doc.fileFormat.toUpperCase()}</Badge>
                  <Badge variant="secondary">{doc.isFree ? 'Miễn phí' : 'Có phí'}</Badge>
                </div>

                {doc.tags?.length ? (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          <Tag data-icon="inline-start" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="description" className="w-full">
            <TabsList>
              <TabsTrigger value="description">Mô tả</TabsTrigger>
              <TabsTrigger value="preview">Xem trước</TabsTrigger>
              <TabsTrigger value="meta">Thông tin kỹ thuật</TabsTrigger>
            </TabsList>
            <TabsContent value="description">
              <Card>
                <CardHeader>
                  <CardTitle>Mô tả chi tiết</CardTitle>
                  <CardDescription>Nội dung tóm tắt và giá trị sử dụng của tài liệu.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line leading-relaxed text-muted-foreground">
                    {doc.description || 'Tài liệu này chưa có mô tả chi tiết.'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Hình ảnh xem trước</CardTitle>
                  <CardDescription>Tham khảo nội dung trước khi quyết định mua.</CardDescription>
                </CardHeader>
                <CardContent>
                  {doc.previewImages && doc.previewImages.length > 1 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {doc.previewImages.slice(1).map((img, i) => (
                        <div key={i} className="aspect-[1/1.41] overflow-hidden rounded-lg border bg-card p-1">
                          <img
                            src={img}
                            alt={`Preview ${i + 2}`}
                            className="h-full w-full rounded-md object-cover transition-transform hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có ảnh xem trước bổ sung.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="meta">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin kỹ thuật</CardTitle>
                  <CardDescription>Thông số file và thông tin bán hàng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Định dạng</span>
                    <Badge variant="outline">{doc.fileFormat}</Badge>
                  </div>
                  {doc.pageCount ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Số trang</span>
                      <span>{doc.pageCount} trang</span>
                    </div>
                  ) : null}
                  {doc.fileSize ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kích thước</span>
                      <span>{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Đã bán</span>
                    <span className="font-semibold">{doc.purchaseCount || 0} bản</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Đánh giá</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-primary/30 text-primary" />
                      <span className="font-semibold">
                        {doc.rating?.average > 0 ? doc.rating.average.toFixed(1) : 'Chưa có'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <Card className="overflow-hidden border-2">
            <CardHeader className="border-b bg-primary/5">
              {doc.originalPrice && doc.originalPrice > doc.price ? (
                <p className="text-sm text-muted-foreground line-through">{formatPrice(doc.originalPrice)}</p>
              ) : null}
              <CardTitle className={`text-4xl font-black ${doc.isFree ? 'text-green-600' : 'text-primary'}`}>
                {formatPrice(doc.price)}
              </CardTitle>
              <CardDescription>Thanh toán một lần - tải về không giới hạn thời gian.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {owned ? (
                <Button className="w-full" size="lg" onClick={handleDownload} disabled={downloading}>
                  <Download data-icon="inline-start" />
                  {downloading ? 'Đang chuẩn bị...' : 'Tải tài liệu ngay'}
                </Button>
              ) : doc.isFree ? (
                <Button
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  size="lg"
                  onClick={handleBuy}
                >
                  <Download data-icon="inline-start" />
                  Nhận miễn phí
                </Button>
              ) : (
                <Button className="w-full" size="lg" onClick={handleBuy}>
                  <ShoppingCart data-icon="inline-start" />
                  Mua ngay
                </Button>
              )}

              <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tình trạng sở hữu</span>
                  <Badge variant={owned ? 'default' : 'secondary'}>
                    {checking ? 'Đang kiểm tra' : owned ? 'Đã sở hữu' : 'Chưa sở hữu'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đã bán</span>
                  <span className="font-semibold">{doc.purchaseCount || 0} bản</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lượt xem</span>
                  <span>{doc.viewCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đánh giá</span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-primary/30 text-primary" />
                    {doc.rating?.average > 0 ? doc.rating.average.toFixed(1) : 'Chưa có'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-4 text-sm">
                <p className="font-medium">Cam kết sau mua</p>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Tải ngay sau khi thanh toán thành công.</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Thông tin giao dịch và lịch sử mua lưu trong tài khoản.</span>
                </div>
              </div>

              {doc.relatedArticle ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/articles/${doc.relatedArticle.slug}`}>
                    <BookOpen data-icon="inline-start" />
                    Đọc bài phân tích miễn phí
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="space-y-3 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <FileBox />
                  Định dạng
                </span>
                <Badge variant="outline">{doc.fileFormat}</Badge>
              </div>
              {doc.fileSize ? (
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Scaling />
                    Kích thước
                  </span>
                  <span>{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              ) : null}
              {doc.pageCount ? (
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <BookOpen />
                    Số trang
                  </span>
                  <span>{doc.pageCount} trang</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
