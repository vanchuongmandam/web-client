// src/app/admin/documents/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAdminDocuments, deleteDocument as apiDeleteDocument } from '@/lib/api';
import type { MarketDocument, PaginationMeta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, FileText, Eye, Search, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PaginationControls } from '@/components/ui/pagination-controls';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const statusLabel: Record<string, string> = {
  draft: 'Bản nháp',
  active: 'Đang bán',
  archived: 'Đã ẩn',
};

export default function AdminDocumentsPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<MarketDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadDocuments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string; search?: string } = {
        page,
        limit: 20,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await getAdminDocuments(params, token);
      setDocuments(res.data);
      setPagination(res.pagination);
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách tài liệu', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter, searchTerm, toast]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm]);

  const handleDelete = async (slug: string) => {
    if (!token || !confirm('Bạn có chắc muốn xóa tài liệu này?')) return;
    try {
      await apiDeleteDocument(slug, token);
      toast({ title: 'Đã xóa', description: 'Tài liệu đã được xóa' });
      loadDocuments();
    } catch (err: unknown) {
      toast({ title: 'Lỗi', description: err instanceof Error ? err.message : 'Không thể xóa', variant: 'destructive' });
    }
  };

  const totalOnPage = documents.length;
  const activeOnPage = documents.filter((doc) => doc.status === 'active').length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <FileText />
              Quản lý tài liệu
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi danh mục tài liệu marketplace, trạng thái và hiệu suất bán.
            </p>
          </div>
          <Link href="/admin/documents/new">
            <Button>
              <Plus data-icon="inline-start" />
              Thêm tài liệu
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tài liệu trang hiện tại</CardDescription>
            <CardTitle className="text-2xl">{totalOnPage}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tài liệu đang bán</CardDescription>
            <CardTitle className="text-2xl">{activeOnPage}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng bản ghi API</CardDescription>
            <CardTitle className="text-2xl">{pagination?.total ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách tài liệu</CardTitle>
          <CardDescription>Lọc nhanh theo trạng thái và tên tài liệu/tác giả.</CardDescription>
          <Separator />
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên tài liệu hoặc tác giả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="active">Đang bán</SelectItem>
                <SelectItem value="archived">Đã ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Lượt mua</TableHead>
                <TableHead className="text-right">Lượt xem</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">{doc.author}</div>
                    </div>
                  </TableCell>
                  <TableCell>{doc.category?.name || '-'}</TableCell>
                  <TableCell>{formatPrice(doc.price)}</TableCell>
                  <TableCell>
                    <Badge variant={doc.status === 'active' ? 'default' : 'secondary'}>
                      {statusLabel[doc.status] || doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{doc.purchaseCount}</TableCell>
                  <TableCell className="text-right">{doc.viewCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/documents/${doc.slug}`}>
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Link href={`/admin/documents/edit/${doc.slug}`}>
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.slug)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 py-4">
                      <LayoutGrid className="text-muted-foreground" />
                      <p>Không có tài liệu phù hợp với bộ lọc hiện tại.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={setPage}
          isLoading={loading}
        />
      )}
    </div>
  );
}
