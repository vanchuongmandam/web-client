// src/app/admin/documents/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { getAdminDocuments, deleteDocument as apiDeleteDocument } from '@/lib/api';
import type { MarketDocument, PaginationMeta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, FileText, Eye, Search, LayoutGrid, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const statusLabel: Record<string, string> = {
  draft: 'Bản nháp',
  active: 'Đang bán',
  archived: 'Đã ẩn',
};

export default function AdminDocumentsPage() {
  const token = useAuthStore((s) => s.token);
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
        limit: 15,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Quản lý Tài liệu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng cộng: {pagination?.total ?? 0} tài liệu trong hệ thống.
          </p>
        </div>
        <Button asChild size="sm" className="h-9 text-xs font-bold shadow-sm">
          <Link href="/admin/documents/new">
            <Plus className="mr-2 h-4 w-4" /> Thêm tài liệu
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border border-border/60 shadow-sm rounded-xl">
          <CardHeader className="py-3 px-4">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tài liệu hiện tại</CardDescription>
            <CardTitle className="text-2xl font-bold mt-1 tracking-tight">{loading ? <Skeleton className="h-8 w-12" /> : totalOnPage}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-border/60 shadow-sm rounded-xl">
          <CardHeader className="py-3 px-4">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tài liệu đang bán</CardDescription>
            <CardTitle className="text-2xl font-bold mt-1 tracking-tight text-emerald-600">{loading ? <Skeleton className="h-8 w-12" /> : activeOnPage}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-border/60 shadow-sm rounded-xl">
          <CardHeader className="py-3 px-4">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tổng số tài liệu</CardDescription>
            <CardTitle className="text-2xl font-bold mt-1 tracking-tight">{loading ? <Skeleton className="h-8 w-12" /> : (pagination?.total ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border border-border/60 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="py-4 border-b border-border/40 bg-zinc-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Bộ lọc & Tìm kiếm</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">Tìm kiếm nhanh tài liệu marketplace.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-stretch sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên tài liệu hoặc tác giả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-lg border-zinc-200 bg-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9 text-xs rounded-lg bg-white border-zinc-200">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="text-xs" value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem className="text-xs" value="draft">Bản nháp</SelectItem>
                  <SelectItem className="text-xs" value="active">Đang bán</SelectItem>
                  <SelectItem className="text-xs" value="archived">Đã ẩn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Tài liệu</TableHead>
                <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Danh mục</TableHead>
                <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Giá bán</TableHead>
                <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="text-right text-xs font-semibold py-2.5 text-muted-foreground">Lượt mua</TableHead>
                <TableHead className="text-right text-xs font-semibold py-2.5 text-muted-foreground">Lượt xem</TableHead>
                <TableHead className="text-right text-xs font-semibold py-2.5 text-muted-foreground pr-4">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-3.5"><Skeleton className="h-5 w-full rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground font-semibold text-sm">
                    <div className="flex flex-col items-center gap-2 py-4">
                      <LayoutGrid className="h-6 w-6 text-muted-foreground/60" />
                      <p className="text-xs">Không có tài liệu nào phù hợp với bộ lọc hiện tại.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc._id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                    <TableCell className="py-2.5">
                      <div className="font-bold text-foreground text-xs">{doc.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{doc.author}</div>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground font-semibold">{doc.category?.name || 'Chưa phân loại'}</TableCell>
                    <TableCell className="py-2.5 text-xs text-foreground font-bold font-mono">{formatPrice(doc.price)}</TableCell>
                    <TableCell className="py-2.5">
                      {doc.status === 'active' ? (
                        <Badge className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border-emerald-200/40 text-emerald-700 hover:bg-emerald-500/10">
                          {statusLabel[doc.status] || doc.status}
                        </Badge>
                      ) : doc.status === 'draft' ? (
                        <Badge className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border-amber-200/40 text-amber-700 hover:bg-amber-500/10">
                          {statusLabel[doc.status] || doc.status}
                        </Badge>
                      ) : (
                        <Badge className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-zinc-500/10 border-zinc-200/40 text-zinc-600 hover:bg-zinc-500/10">
                          {statusLabel[doc.status] || doc.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-semibold text-xs font-mono">{doc.purchaseCount}</TableCell>
                    <TableCell className="py-2.5 text-right font-semibold text-xs font-mono text-muted-foreground">{doc.viewCount}</TableCell>
                    <TableCell className="py-2.5 pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-muted rounded-md border border-transparent hover:border-border/30">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hành động</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="text-xs font-medium cursor-pointer">
                            <Link href={`/documents/${doc.slug}`}>
                              <Eye className="h-3 w-3 mr-2" /> Xem Chi tiết
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="text-xs font-medium cursor-pointer">
                            <Link href={`/admin/documents/edit/${doc.slug}`}>
                              <Pencil className="h-3 w-3 mr-2" /> Chỉnh sửa
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-xs font-semibold cursor-pointer text-rose-600 hover:text-rose-700" 
                            onClick={() => handleDelete(doc.slug)}
                          >
                            <Trash2 className="h-3 w-3 mr-2" /> Xóa tài liệu
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="pt-2">
          <PaginationControls
            pagination={pagination}
            onPageChange={setPage}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
}
