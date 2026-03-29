// src/app/profile/purchases/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getUserPurchases, getDocumentDownload } from '@/lib/api';
import type { Purchase, PaginationMeta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileText, Star, BookOpen } from 'lucide-react';

export default function PurchasesPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/login'); return; }

    setLoading(true);
    getUserPurchases({ page, limit: 10 }, token)
      .then((res) => {
        setPurchases(res.data);
        setPagination(res.pagination);
      })
      .catch(() => toast({ title: 'Loi', description: 'Khong the tai danh sach', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [authLoading, token, router, page, toast]);

  const handleDownload = async (documentId: string) => {
    if (!token) return;
    try {
      const info = await getDocumentDownload(documentId, token);
      window.open(info.downloadUrl, '_blank');
    } catch (err: unknown) {
      toast({ title: 'Loi', description: err instanceof Error ? err.message : 'Khong the tai', variant: 'destructive' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold flex items-center gap-2">
        <BookOpen className="h-8 w-8" /> Thu vien cua toi
      </h1>

      {purchases.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Chua co tai lieu nao</h2>
          <p className="mt-2 text-muted-foreground">Hay mua tai lieu dau tien tu kho tai lieu.</p>
          <Button className="mt-4" onClick={() => router.push('/documents')}>
            Kham pha tai lieu
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase._id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <Link href={`/documents/${purchase.document.slug}`} className="font-semibold hover:underline">
                    {purchase.document.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{purchase.document.author}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{purchase.document.fileFormat?.toUpperCase()}</Badge>
                    <span>Da tai {purchase.downloadCount} lan</span>
                    {purchase.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" /> {purchase.rating}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" onClick={() => handleDownload(purchase.document._id)}>
                  <Download className="mr-1 h-4 w-4" /> Tai
                </Button>
              </CardContent>
            </Card>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang truoc
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
