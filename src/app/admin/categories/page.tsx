// src/app/admin/categories/page.tsx
"use client";

import { useState, useEffect, FormEvent, Fragment, useCallback } from 'react';
import type { Category } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Loader2, CornerDownRight } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateSlug } from '@/lib/utils';

// --- API Functions ---
async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

async function createCategory(data: { name: string, slug: string, parentId?: string }, token: string): Promise<Category> {
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

// Component con để render danh sách danh mục (hỗ trợ đệ quy)
const CategoryItem = ({ category, level = 0, onDelete }: { category: Category; level?: number; onDelete: (id: string) => void; }) => {
  return (
    <>
      <div className="flex items-center justify-between p-3 border-b rounded-md">
        <div className="flex items-center">
          {level > 0 && <CornerDownRight className="h-4 w-4 mr-2 text-muted-foreground" style={{ marginLeft: `${level * 1.5}rem` }} />}
          <div>
            <p className="font-medium">{category.name}</p>
            <p className="text-sm text-muted-foreground">Slug: {category.slug}</p>
          </div>
        </div>
        <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><X className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle><AlertDialogDescription>Hành động này sẽ xóa danh mục &quot;{category.name}&quot;. Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(category._id)}>Tiếp tục Xóa</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
      {category.children && category.children.map(child => (
        <CategoryItem key={child._id} category={child} level={level + 1} onDelete={onDelete} />
      ))}
    </>
  );
};

// --- Main Component ---
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(undefined);
  
  const { token } = useAuth();
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
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
    const dataToSend: { name: string, slug: string, parentId?: string } = { name: newCategoryName, slug };
    if (parentCategoryId) {
      dataToSend.parentId = parentCategoryId;
    }

    try {
      await createCategory(dataToSend, token);
      await fetchCategories(); // Tải lại toàn bộ cây danh mục
      setNewCategoryName('');
      setParentCategoryId(undefined);
      toast({ title: "Thành công!", description: "Đã tạo danh mục mới." });
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
      await deleteCategoryById(idToDelete, token);
      await fetchCategories(); // Tải lại cây
      toast({ title: "Thành công!", description: "Danh mục đã được xóa." });
    } catch (error: unknown) {
        if (error instanceof Error) {
            toast({ variant: "destructive", title: "Lỗi", description: error.message });
        }
    }
  };

  // Hàm để làm phẳng cây danh mục cho dropdown
  const flattenCategories = (categories: Category[], level = 0): { _id: string, name: string }[] => {
    let flatList: { _id: string, name: string }[] = [];
    for (const category of categories) {
      flatList.push({ _id: category._id, name: `${'— '.repeat(level)}${category.name}` });
      if (category.children) {
        flatList = flatList.concat(flattenCategories(category.children, level + 1));
      }
    }
    return flatList;
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">Quản lý Danh mục</h1>
        <p className="text-muted-foreground mt-2">Thêm, xóa và xem tất cả các danh mục bài viết.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Thêm danh mục mới</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              placeholder="Tên danh mục mới..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={isSubmitting}
            />
            <Select onValueChange={(value) => setParentCategoryId(value === 'none' ? undefined : value)} disabled={isSubmitting}>
              <SelectTrigger><SelectValue placeholder="Chọn danh mục cha (tùy chọn)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có</SelectItem>
                {flattenCategories(categories).map(cat => (
                  <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isSubmitting || !newCategoryName.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Thêm
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Separator className="my-8"/>

      <Card>
        <CardHeader><CardTitle>Danh sách danh mục</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? ( <Skeleton className="h-24 w-full" /> ) : (
            <div>
              {categories.map((cat) => ( <CategoryItem key={cat._id} category={cat} onDelete={handleDelete} /> ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
