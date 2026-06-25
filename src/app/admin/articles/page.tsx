"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Article, PaginationMeta } from '@/lib/types';
import { formatVietnameseDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { getArticlesPaginated, searchArticlesPaginated, deleteArticle } from '@/lib/api';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  // Handle debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchArticles = useCallback(async (page: number, currentSearch: string) => {
    setIsLoading(true);
    try {
      let result;
      if (currentSearch.trim()) {
        result = await searchArticlesPaginated(
          currentSearch.trim(),
          { page, limit: 20 },
          { cache: 'no-store' }
        );
      } else {
        result = await getArticlesPaginated(
          { page, limit: 20, sort: '-createdAt' },
          { cache: 'no-store' }
        );
      }
      setArticles(result.data);
      setPagination(result.pagination);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchArticles(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchArticles]);

  const handleDelete = async (slugToDelete: string) => {
    if (!token) {
      toast({ variant: "destructive", title: "Lỗi", description: "Yêu cầu xác thực không hợp lệ." });
      return;
    }
    try {
      await deleteArticle(slugToDelete, token);
      toast({ title: "Thành công!", description: "Bài viết đã được xóa." });
      fetchArticles(currentPage, debouncedSearch);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: (error as Error).message });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Quản lý Bài viết
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng số: {pagination?.total ?? articles.length} bài viết hiện có trên hệ thống.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-stretch sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              className="w-full pl-9 h-9 text-xs rounded-lg border-zinc-200 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild className="shrink-0 h-9 text-xs font-bold shadow-sm" variant="default">
            <Link href="/admin/articles/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm bài viết
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-md" />)}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Tiêu đề</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Tác giả</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Danh mục</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Ngày đăng</TableHead>
                  <TableHead className="text-right text-xs font-semibold py-2.5 text-muted-foreground pr-4">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground font-semibold text-sm">
                      Không tìm thấy bài viết nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  articles.map((article) => (
                    <TableRow key={article._id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                      <TableCell className="py-2.5 font-bold text-foreground max-w-xs truncate" title={article.title}>{article.title}</TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground font-medium">{article.author}</TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-muted/50 border-border text-zinc-700">
                          {article.category?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground font-medium">{formatVietnameseDate(article.date)}</TableCell>
                      <TableCell className="py-2.5 pr-4 text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-muted rounded-md border border-transparent hover:border-border/30"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hành động</DropdownMenuLabel>
                              <DropdownMenuItem asChild className="text-xs font-medium cursor-pointer"><Link href={`/admin/articles/edit/${article.slug}`}>Sửa</Link></DropdownMenuItem>
                              <AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-xs font-semibold cursor-pointer text-rose-600 hover:text-rose-700">Xóa</DropdownMenuItem></AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base font-bold text-foreground">Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs text-muted-foreground">Hành động này sẽ xóa vĩnh viễn bài viết &quot;{article.title}&quot;. Bạn không thể hoàn tác.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2 sm:gap-0">
                              <AlertDialogCancel className="h-9 text-xs font-bold">Hủy</AlertDialogCancel>
                              <AlertDialogAction className="h-9 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(article.slug)}>Tiếp tục Xóa</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {pagination && (
            <div className="pt-2">
              <PaginationControls
                pagination={pagination}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
