// src/app/admin/documents/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAdminDocuments, deleteDocument as apiDeleteDocument } from '@/lib/api';
import type { MarketDocument, PaginationMeta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, FileText, Eye } from 'lucide-react';
import Link from 'next/link';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
};

export default function AdminDocumentsPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<MarketDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadDocuments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getAdminDocuments({ page, limit: 20 }, token);
      setDocuments(res.data);
      setPagination(res.pagination);
    } catch {
      toast({ title: 'Loi', description: 'Khong the tai danh sach tai lieu', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, page, toast]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleDelete = async (slug: string) => {
    if (!token || !confirm('Ban co chac muon xoa tai lieu nay?')) return;
    try {
      await apiDeleteDocument(slug, token);
      toast({ title: 'Da xoa', description: 'Tai lieu da duoc xoa' });
      loadDocuments();
    } catch (err: unknown) {
      toast({ title: 'Loi', description: err instanceof Error ? err.message : 'Khong the xoa', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" /> Quan ly tai lieu
        </h1>
        <Link href="/admin/documents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Them tai lieu
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tai lieu</TableHead>
                <TableHead>Danh muc</TableHead>
                <TableHead>Gia</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead className="text-right">Luot mua</TableHead>
                <TableHead className="text-right">Luot xem</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">{doc.author}</div>
                    </div>
                  </TableCell>
                  <TableCell>{doc.category?.name || '-'}</TableCell>
                  <TableCell>{formatPrice(doc.price)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[doc.status] || ''}`}>
                      {doc.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{doc.purchaseCount}</TableCell>
                  <TableCell className="text-right">{doc.viewCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/documents/${doc.slug}`}>
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Link href={`/admin/documents/edit/${doc.slug}`}>
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.slug)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Chua co tai lieu nao
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
            Trang truoc
          </Button>
          <span className="flex items-center text-sm">{pagination.page} / {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
