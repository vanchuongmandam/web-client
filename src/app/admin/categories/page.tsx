// src/app/admin/categories/page.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import type { Category } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Loader2 } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';


// --- API Functions ---
async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

async function createCategory(data: { name: string, slug: string }, token: string): Promise<Category> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create category");
  }
  return res.json();
}

async function deleteCategoryById(id: string, token: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete category');
  }
}

// Helper để tạo slug tự động
const generateSlug = (name: string) =>
  name.toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');


// --- Main Component ---
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải danh sách danh mục." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [toast]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !token) return;

    setIsSubmitting(true);
    const slug = generateSlug(newCategoryName);
    try {
      const newCat = await createCategory({ name: newCategoryName, slug }, token);
      setCategories(prev => [...prev, newCat]);
      setNewCategoryName('');
      toast({ title: "Thành công!", description: "Đã tạo danh mục mới." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (idToDelete: string) => {
    if (!token) return;
    try {
      await deleteCategoryById(idToDelete, token);
      setCategories(prev => prev.filter(cat => cat._id !== idToDelete));
      toast({ title: "Thành công!", description: "Danh mục đã được xóa." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">Quản lý Danh mục</h1>
        <p className="text-muted-foreground mt-2">Thêm, xóa và xem tất cả các danh mục bài viết.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Thêm danh mục mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex items-center gap-4">
            <Input
              placeholder="Tên danh mục mới (vd: Tản văn)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={isSubmitting}
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting || !newCategoryName.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Thêm
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Separator className="my-8"/>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách danh mục</CardTitle>
          <CardDescription>Tổng số: {categories.length} danh mục</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat._id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-sm text-muted-foreground">Slug: {cat.slug}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><X className="h-4 w-4 text-destructive"/></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>Hành động này sẽ xóa vĩnh viễn danh mục "{cat.name}". Nếu có bài viết nào thuộc danh mục này, bạn có thể cần phải cập nhật chúng.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(cat._id)}>Tiếp tục Xóa</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
