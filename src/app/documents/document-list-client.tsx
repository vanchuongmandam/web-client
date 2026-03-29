// src/app/documents/document-list-client.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { MarketDocument, Category, PaginationMeta } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { FileText, Star, Eye, Download, Search } from 'lucide-react';

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

function DocumentCard({ doc }: { doc: MarketDocument }) {
  const previewImage = doc.previewImages?.[0];

  return (
    <Link href={`/documents/${doc.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="p-0">
          {previewImage ? (
            <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
              <img
                src={previewImage}
                alt={doc.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-t-lg bg-muted">
              <FileText className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            {doc.category && (
              <Badge variant="secondary" className="text-xs">
                {doc.category.name}
              </Badge>
            )}
            {doc.featured && (
              <Badge variant="default" className="text-xs">
                Nổi bật
              </Badge>
            )}
          </div>
          <h3 className="mb-1 line-clamp-2 font-semibold leading-tight">{doc.title}</h3>
          <p className="mb-2 text-sm text-muted-foreground">{doc.author}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{doc.description}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {doc.rating.average > 0 ? doc.rating.average.toFixed(1) : '-'}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {doc.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {doc.purchaseCount}
            </span>
          </div>
          <span className={`font-bold ${doc.isFree ? 'text-green-600' : 'text-primary'}`}>
            {formatPrice(doc.price)}
          </span>
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

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams();
    if (currentCategory && key !== 'category') params.set('category', currentCategory);
    if (currentSearch && key !== 'search') params.set('search', currentSearch);
    if (currentSort && key !== 'sort') params.set('sort', currentSort);
    if (value) params.set(key, value);
    params.set('page', '1');
    router.push(`/documents?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchValue || undefined);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Kho Tài Liệu</h1>
        <p className="mt-2 text-muted-foreground">
          Tài liệu văn học chất lượng cao - phân tích, bình giảng, đề thi và tài liệu ôn tập.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select
          value={currentCategory || 'all'}
          onValueChange={(v) => updateFilter('category', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentSort || '-createdAt'}
          onValueChange={(v) => updateFilter('sort', v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-createdAt">Mới nhất</SelectItem>
            <SelectItem value="price">Giá tăng dần</SelectItem>
            <SelectItem value="-price">Giá giảm dần</SelectItem>
            <SelectItem value="-purchaseCount">Bán chạy nhất</SelectItem>
            <SelectItem value="-rating.average">Đánh giá cao nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document Grid */}
      {initialDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Không tìm thấy tài liệu</h2>
          <p className="mt-2 text-muted-foreground">Thử thay đổi bộ lọc hoặc tìm kiếm khác.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {initialDocuments.map((doc) => (
              <DocumentCard key={doc._id} doc={doc} />
            ))}
          </div>

          {initialPagination.totalPages > 1 && (
            <div className="mt-8">
              <PaginationControls
                currentPage={currentPage}
                totalPages={initialPagination.totalPages}
                basePath="/documents"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
