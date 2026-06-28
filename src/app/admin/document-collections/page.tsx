"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import type { DocumentCollection } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getDocumentCollections, createDocumentCollection, deleteDocumentCollection } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Loader2, Layers } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

export default function AdminDocumentCollectionsPage() {
  const [collections, setCollections] = useState<DocumentCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  
  const { token } = useAuth();
  const { toast } = useToast();

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDocumentCollections();
      setCollections(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || !token) return;

    setIsSubmitting(true);
    const slug = generateSlug(newCollectionName);
    const dataToSend = { name: newCollectionName, slug, description: newCollectionDescription };

    try {
      await createDocumentCollection(dataToSend, token);
      await fetchCollections();
      setNewCollectionName('');
      setNewCollectionDescription('');
      toast({ title: "Thành công!", description: "Đã tạo bộ sưu tập mới." });
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
      await deleteDocumentCollection(idToDelete, token);
      await fetchCollections();
      toast({ title: "Thành công!", description: "Bộ sưu tập đã được xóa." });
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
            Quản lý Bộ sưu tập đề thi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và thêm mới các bộ sưu tập, chuyên đề thi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border border-border/60 shadow-sm rounded-xl h-fit">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Thêm bộ sưu tập mới</CardTitle>
            <CardDescription className="text-xs">Tạo mới bộ sưu tập hoặc chuyên đề.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collection-name" className="text-xs font-bold">Tên bộ sưu tập</Label>
                <Input
                  id="collection-name"
                  placeholder="VD: HSG Quốc Gia"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection-desc" className="text-xs font-bold">Mô tả (Tùy chọn)</Label>
                <Textarea
                  id="collection-desc"
                  placeholder="Mô tả ngắn về bộ sưu tập..."
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  disabled={isSubmitting}
                  className="text-xs rounded-lg min-h-[80px]"
                />
              </div>

              <Button type="submit" size="sm" className="w-full h-9 text-xs font-bold" disabled={isSubmitting || !newCollectionName.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang thêm...
                  </>
                ) : "Thêm bộ sưu tập"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 border border-border/60 shadow-sm rounded-xl">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Danh sách bộ sưu tập</CardTitle>
            <CardDescription className="text-xs">Danh sách tất cả các bộ sưu tập đề thi hiện có trong hệ thống.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            {isLoading ? ( 
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8 text-xs font-medium text-muted-foreground">
                Chưa có bộ sưu tập nào được định nghĩa.
              </div>
            ) : (
              <div className="border border-border/40 rounded-lg p-2 bg-zinc-50/50 flex flex-col gap-2">
                {collections.map((collection) => ( 
                  <div key={collection._id} className="w-full bg-white flex items-center justify-between py-3 px-4 shadow-sm border border-border/50 rounded-lg group">
                    <div className="flex items-center min-w-0">
                      <Layers className="h-4 w-4 text-primary/70 mr-3 shrink-0" />
                      <div className="min-w-0 flex flex-col">
                        <p className="font-bold text-sm text-foreground truncate">{collection.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">Slug: {collection.slug}</p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-rose-600 rounded-md transition-all">
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base font-bold text-foreground">Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-muted-foreground">
                            Hành động này sẽ xóa bộ sưu tập &quot;{collection.name}&quot;. Những tài liệu đang thuộc bộ sưu tập này sẽ bị gỡ bỏ khỏi đây.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                          <AlertDialogCancel className="h-9 text-xs font-bold">Hủy</AlertDialogCancel>
                          <AlertDialogAction className="h-9 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(collection._id)}>
                            Tiếp tục Xóa
                          </AlertDialogAction>
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
    </div>
  );
}
