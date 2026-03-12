"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Article, PaginationMeta } from '@/lib/types';
import { formatVietnameseDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
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
    <div className="container mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Quản lý Bài viết</h1>
          <p className="text-muted-foreground mt-2">
            Tổng số: {pagination?.total ?? articles.length} bài viết
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild className="shrink-0">
            <Link href="/admin/articles/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm bài viết
            </Link>
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Ngày đăng</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      Không tìm thấy bài viết nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  articles.map((article) => (
                    <TableRow key={article._id}>
                      <TableCell className="font-medium max-w-xs truncate" title={article.title}>{article.title}</TableCell>
                      <TableCell>{article.author}</TableCell>
                      <TableCell>{article.category?.name}</TableCell>
                      <TableCell>{formatVietnameseDate(article.date)}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild><Link href={`/admin/articles/edit/${article.slug}`}>Sửa</Link></DropdownMenuItem>
                              <AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-500">Xóa</DropdownMenuItem></AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                              <AlertDialogDescription>Hành động này sẽ xóa vĩnh viễn bài viết &quot;{article.title}&quot;. Bạn không thể hoàn tác.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(article.slug)}>Tiếp tục Xóa</AlertDialogAction>
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
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
