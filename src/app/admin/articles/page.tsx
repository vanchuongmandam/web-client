// src/app/admin/articles/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';

// --- Hàm gọi API ---
async function getArticles(): Promise<Article[]> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${apiBaseUrl}/articles`, { cache: 'no-store' }); // No cache for admin data
  if (!response.ok) throw new Error("Failed to fetch articles");
  return response.json();
}

async function deleteArticleBySlug(slug: string, token: string): Promise<void> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${apiBaseUrl}/articles/${slug}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete article');
  }
}

// --- Component chính ---
export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const data = await getArticles();
        setArticles(data);
      } catch (error) {
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải danh sách bài viết." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, [toast]);

  const handleDelete = async (slugToDelete: string) => {
    if (!token) {
      toast({ variant: "destructive", title: "Lỗi", description: "Yêu cầu xác thực không hợp lệ." });
      return;
    }
    try {
      await deleteArticleBySlug(slugToDelete, token);
      // Cập nhật lại giao diện ngay lập tức
      setArticles(prev => prev.filter(article => article.slug !== slugToDelete));
      toast({ title: "Thành công!", description: "Bài viết đã được xóa." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Quản lý Bài viết</h1>
          <p className="text-muted-foreground mt-2">Tổng số: {articles.length} bài viết</p>
        </div>
        <Button asChild>
          <Link href="/admin/articles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm bài viết mới
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      ) : (
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
              {articles.map((article) => (
                <TableRow key={article._id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.author}</TableCell>
                  <TableCell>{article.category.name}</TableCell>
                  <TableCell>{article.date}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/admin/articles/edit/${article.slug}`}>Sửa</Link></DropdownMenuItem>
                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-500">Xóa</DropdownMenuItem></AlertDialogTrigger>
                          </DropdownMenuContent>
                       </DropdownMenu>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                            <AlertDialogDescription>Hành động này sẽ xóa vĩnh viễn bài viết "{article.title}". Bạn không thể hoàn tác.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(article.slug)}>Tiếp tục Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                       </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
