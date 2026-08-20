// src/app/admin/categories/page.tsx
"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import type { Category } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCategories, createCategory, deleteCategory } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Loader2, CornerDownRight, Folder } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateSlug } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// Subcomponent to render category list recursively
const CategoryItem = ({ category, level = 0, onDelete }: { category: Category; level?: number; onDelete: (id: string) => void; }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/40 transition-colors rounded-lg group border-b border-border/30 last:border-0">
        <div className="flex items-center min-w-0">
          {level > 0 && (
            <div className="flex items-center shrink-0" style={{ width: `${level * 1.25}rem` }}>
              <span className="w-full border-l border-b border-zinc-200 h-4 rounded-bl-md mr-1 self-start -mt-2"></span>
              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/60 mr-1 shrink-0" />
            </div>
          )}
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
                Hành động này sẽ xóa danh mục &quot;{category.name}&quot; và tất cả danh mục con của nó. Không thể hoàn tác.
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
      {category.children && category.children.map(child => (
        <CategoryItem key={child._id} category={child} level={level + 1} onDelete={onDelete} />
      ))}
    </div>
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
      const data = await getCategories({ cache: 'no-store' });
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
      await fetchCategories(); // Reload full category tree
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
      await deleteCategory(idToDelete, token);
      await fetchCategories(); // Reload tree
      toast({ title: "Thành công!", description: "Danh mục đã được xóa." });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({ variant: "destructive", title: "Lỗi", description: error.message });
      }
    }
  };

  // Flatten the category tree for select dropdown
  const flattenCategories = (categoriesList: Category[], level = 0): { _id: string, name: string }[] => {
    let flatList: { _id: string, name: string }[] = [];
    for (const category of categoriesList) {
      flatList.push({ _id: category._id, name: `${'— '.repeat(level)}${category.name}` });
      if (category.children) {
        flatList = flatList.concat(flattenCategories(category.children, level + 1));
      }
    }
    return flatList;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Quản lý Danh mục
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và cấu hình phân cấp các danh mục bài viết.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create column */}
        <Card className="lg:col-span-1 border border-border/60 shadow-sm rounded-xl h-fit">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Thêm danh mục mới</CardTitle>
            <CardDescription className="text-xs">Tạo danh mục mới hoặc phân cấp dưới danh mục cha.</CardDescription>
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

              <div className="space-y-2">
                <Label className="text-xs font-bold">Danh mục cha (Tùy chọn)</Label>
                <Select 
                  value={parentCategoryId || "none"}
                  onValueChange={(value) => setParentCategoryId(value === 'none' ? undefined : value)} 
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-9 text-xs rounded-lg">
                    <SelectValue placeholder="Chọn danh mục cha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="text-xs" value="none">Không có (Cấp cao nhất)</SelectItem>
                    {flattenCategories(categories).map(cat => (
                      <SelectItem className="text-xs" key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        
        {/* List tree column */}
        <Card className="lg:col-span-2 border border-border/60 shadow-sm rounded-xl">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Danh sách danh mục hiện có</CardTitle>
            <CardDescription className="text-xs">Hiển thị cấu trúc cây thư mục. Di chuột vào danh mục để hiện nút xóa.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            {isLoading ? ( 
              <div className="space-y-2">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-9 w-5/6 rounded-lg ml-6" />
                <Skeleton className="h-9 w-4/5 rounded-lg ml-6" />
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
