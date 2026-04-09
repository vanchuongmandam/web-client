// src/app/documents/document-list-client.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MarketDocument, Category, PaginationMeta } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { FileText, Star, Eye, Download, Search, FilterX, SlidersHorizontal } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface DocumentListClientProps {
  initialDocuments: MarketDocument[];
  initialPagination: PaginationMeta;
  categories: Category[];
  currentCategory?: string;
  currentSearch?: string;
  currentSort?: string;
  currentPage: number;
}

function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const sortOptions = [
  { value: '-createdAt', label: 'Đăng gần đây' },
  { value: 'price', label: 'Giá từ thấp đến cao' },
  { value: '-price', label: 'Giá từ cao đến thấp' },
  { value: '-purchaseCount', label: 'Bán chạy nhất' },
  { value: '-rating.average', label: 'Đánh giá cao nhất' },
];

function DocumentCard({ doc }: { doc: MarketDocument }) {
  const previewImage = doc.previewImages?.[0];

  return (
    <Link href={`/documents/${doc.slug}`} className="block h-full group">
      <Card className="h-full flex flex-col shadow-none border-2 border-border/40 hover:border-primary/60 transition-colors bg-card/80 backdrop-blur-sm rounded-xl overflow-hidden">
        <CardHeader className="p-0 border-b border-border/40 bg-muted/30">
          <div className="relative w-full aspect-[1/1.41] overflow-hidden flex items-center justify-center p-4">
            {previewImage ? (
              <img
                src={previewImage}
                alt={doc.title}
                className="w-full h-full object-cover rounded shadow-sm transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
               <div className="w-full h-full bg-background border rounded shadow-sm flex flex-col items-center justify-center text-muted-foreground transition-transform duration-500 group-hover:scale-105">
                 <FileText className="h-10 w-10 mb-2 opacity-50" />
                 <span className="text-xs font-medium uppercase tracking-wider opacity-70">Tài liệu</span>
               </div>
             )}
             
             <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                {doc.featured && (
                <Badge className="font-semibold px-2 py-0.5 text-[10px] shadow-sm">
                  Nổi bật
                </Badge>
              )}
            </div>
            {doc.category && (
              <Badge variant="secondary" className="absolute bottom-2 right-2 text-[10px] shadow-sm font-medium">
                {doc.category.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="line-clamp-2 font-bold text-base leading-tight group-hover:text-primary transition-colors">{doc.title}</h3>
            <p className="text-xs text-muted-foreground font-medium truncate">{doc.author}</p>
          </div>
          
          <div className="mt-auto flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <Star className="h-3 w-3 fill-primary/20 text-primary" />
              {doc.rating?.average > 0 ? doc.rating.average.toFixed(1) : 'Chưa có'}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {doc.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {doc.purchaseCount || 0}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="w-full pt-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Giá bán</span>
            <span className={`text-lg font-black tracking-tight ${doc.isFree ? 'text-green-600' : 'text-primary'}`}>
              {formatPrice(doc.price)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function DocumentListClient({
  initialDocuments,
  initialPagination,
  categories,
  currentCategory,
  currentSearch,
  currentSort,
  currentPage,
}: DocumentListClientProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(currentSearch || '');
  const hasActiveFilters = Boolean(currentCategory || currentSearch || currentSort);

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams();
    if (currentCategory && key !== 'category') params.set('category', currentCategory);
    if (currentSearch && key !== 'search') params.set('search', currentSearch);
    if (currentSort && key !== 'sort') params.set('sort', currentSort);
    if (value) params.set(key, value);
    params.set('page', '1');
    router.push(`/documents?${params.toString()}`);
  };

  const buildParamsForPage = (page: number) => {
    const params = new URLSearchParams();
    if (currentCategory) params.set('category', currentCategory);
    if (currentSearch) params.set('search', currentSearch);
    if (currentSort) params.set('sort', currentSort);
    params.set('page', String(page));
    return params;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchValue || undefined);
  };

  const handlePageChange = (page: number) => {
    router.push(`/documents?${buildParamsForPage(page).toString()}`);
  };

  const clearFilters = () => {
    setSearchValue('');
    router.push('/documents');
  };

  const FilterPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Bộ lọc</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <FilterX data-icon="inline-start" />
            Xóa lọc
          </Button>
        )}
      </div>
      <Separator />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Sắp xếp theo</p>
          <Select value={currentSort || '-createdAt'} onValueChange={(v) => updateFilter('sort', v)}>
            <SelectTrigger className={mobile ? 'w-full' : 'w-full'}>
              <SelectValue placeholder="Mới nhất" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Danh mục</p>
          <Select
            value={currentCategory || 'all'}
            onValueChange={(v) => updateFilter('category', v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Kho Tài liệu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-black tracking-tight mt-2 text-primary">Marketplace Tài Liệu</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl text-lg">
          Khám phá thư viện tài liệu văn học chất lượng cao, bao gồm bài phân tích chuyên sâu, 
          bài giảng, đề thi và các tài liệu ôn tập độc quyền.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
        <Card className="w-full">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <CardTitle className="text-base">Bộ lọc mobile</CardTitle>
              <CardDescription className="mt-1">Sắp xếp và lọc danh mục nhanh</CardDescription>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal data-icon="inline-start" />
                  Bộ lọc
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Bộ lọc tài liệu</SheetTitle>
                  <SheetDescription>Điều chỉnh bộ lọc để tìm tài liệu phù hợp.</SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel mobile />
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="hidden lg:block w-72 shrink-0 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tinh chỉnh kết quả</CardTitle>
              <CardDescription>Áp dụng lọc và sắp xếp như sàn thương mại.</CardDescription>
            </CardHeader>
            <CardContent>
              <FilterPanel />
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 w-full min-w-0">
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Tìm thấy <span className="font-semibold text-foreground">{initialPagination.total}</span> tài liệu
              </p>
              {hasActiveFilters && (
                <Badge variant="secondary">Đang áp dụng bộ lọc</Badge>
              )}
            </div>
            <form onSubmit={handleSearch} className="relative flex items-center w-full max-w-xl">
               <div className="pointer-events-none absolute inset-y-0 text-muted-foreground left-0 pl-3 flex items-center">
                  <Search />
               </div>
              <Input
                placeholder="Nhập tên tài liệu, tác giả bạn muốn tìm..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 h-12 text-base rounded-xl"
              />
              <Button type="submit" size="sm" className="absolute right-1.5 h-9 px-4 rounded-lg font-semibold">
                Tìm kiếm
              </Button>
            </form>
          </div>

          {initialDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
              <div className="bg-background p-4 rounded-full mb-4 shadow-sm">
                <FileText className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <h2 className="text-xl font-bold mb-2">Không tìm thấy tài liệu phù hợp</h2>
              <p className="text-muted-foreground max-w-sm">
                Rất tiếc, không có tài liệu nào khớp với bộ lọc hiện tại của bạn. Bạn hãy thử bỏ bớt điều kiện lọc hoặc nhập từ khóa khác nhé.
              </p>
              <Button variant="outline" className="mt-6 font-semibold" onClick={clearFilters}>Mở rộng tìm kiếm</Button>
            </div>
          ) : (
            <>
              <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {initialDocuments.map((doc) => (
                  <DocumentCard key={doc._id} doc={doc} />
                ))}
              </div>

              {initialPagination.totalPages > 1 && (
                <PaginationControls
                  pagination={initialPagination}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
