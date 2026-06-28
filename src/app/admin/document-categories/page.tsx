"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import type { DocumentCategory } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getDocumentCategories, createDocumentCategory, deleteDocumentCategory } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Loader2, Folder } from 'lucide-react';
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
import { generateSlug } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const CategoryItem = ({ category, onDelete }: { category: DocumentCategory; onDelete: (id: string) => void; }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/40 transition-colors rounded-lg group border-b border-border/30 last:border-0">
        <div className="flex items-center min-w-0">
          <Folder className="h-3.5 w-3.5 text-primary/70 mr-2 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-xs text-foreground truncate">{category.name}</p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">Slug: {category.slug}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-rose-600 rounded-md transition-all">
              <X className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold text-foreground">Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Hành động này sẽ xóa danh mục &quot;{category.name}&quot;. Không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="h-9 text-xs font-bold">Hủy</AlertDialogCancel>
              <AlertDialogAction className="h-9 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(category._id)}>
                Tiếp tục Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default function AdminDocumentCategoriesPage() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const { token } = useAuth();
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDocumentCategories();
      setCategories(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !token) return;

    setIsSubmitting(true);
    const slug = generateSlug(newCategoryName);
    const dataToSend = { name: newCategoryName, slug };

    try {
      await createDocumentCategory(dataToSend, token);
      await fetchCategories();
      setNewCategoryName('');
      toast({ title: "Thành công!", description: "Đã tạo danh mục tài liệu mới." });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({ variant: "destructive", title: "Lỗi", description: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (idToDelete: string) => {
    if (!token) return;
    try {
      await deleteDocumentCategory(idToDelete, token);
      await fetchCategories();
      toast({ title: "Thành công!", description: "Danh mục đã được xóa." });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({ variant: "destructive", title: "Lỗi", description: error.message });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Quản lý Danh mục tài liệu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và cấu hình các danh mục dành riêng cho tài liệu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border border-border/60 shadow-sm rounded-xl h-fit">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Thêm danh mục mới</CardTitle>
            <CardDescription className="text-xs">Tạo danh mục mới cho các tài liệu.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name" className="text-xs font-bold">Tên danh mục</Label>
                <Input
                  id="category-name"
                  placeholder="Tên danh mục mới..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-xs rounded-lg"
                  required
                />
              </div>

              <Button type="submit" size="sm" className="w-full h-9 text-xs font-bold" disabled={isSubmitting || !newCategoryName.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang thêm...
                  </>
                ) : "Thêm danh mục"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 border border-border/60 shadow-sm rounded-xl">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Danh sách danh mục hiện có</CardTitle>
            <CardDescription className="text-xs">Hiển thị danh sách danh mục phẳng. Di chuột vào danh mục để hiện nút xóa.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            {isLoading ? ( 
              <div className="space-y-2">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-xs font-medium text-muted-foreground">
                Chưa có danh mục nào được định nghĩa.
              </div>
            ) : (
              <div className="border border-border/40 rounded-lg p-2 bg-zinc-50/50">
                {categories.map((cat) => ( 
                  <CategoryItem key={cat._id} category={cat} onDelete={handleDelete} /> 
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
