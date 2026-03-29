// src/app/admin/orders/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAdminOrders } from '@/lib/api';
import type { Order, PaginationMeta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, DollarSign } from 'lucide-react';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const statusLabels: Record<string, string> = {
  pending: 'Cho thanh toan',
  paid: 'Da thanh toan',
  confirmed: 'Da xac nhan',
  cancelled: 'Da huy',
  expired: 'Het han',
  refunded: 'Da hoan tien',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  confirmed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
  refunded: 'bg-purple-100 text-purple-800',
};

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await getAdminOrders(params as { page?: number; limit?: number; status?: string }, token);
      setOrders(res.data);
      setPagination(res.pagination);
    } catch {
      toast({ title: 'Loi', description: 'Khong the tai danh sach don hang', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter, toast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Calculate revenue stats from current page (simplified)
  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'confirmed');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold flex items-center gap-2">
        <Package className="h-8 w-8" /> Quan ly don hang
      </h1>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Package className="h-10 w-10 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Tong don hang</div>
              <div className="text-2xl font-bold">{pagination?.total || 0}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <DollarSign className="h-10 w-10 text-green-500" />
            <div>
              <div className="text-sm text-muted-foreground">Doanh thu (trang nay)</div>
              <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Loader2 className="h-10 w-10 text-yellow-500" />
            <div>
              <div className="text-sm text-muted-foreground">Don cho xu ly</div>
              <div className="text-2xl font-bold">{orders.filter((o) => o.status === 'pending').length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Loc trang thai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ma don</TableHead>
                <TableHead>Khach hang</TableHead>
                <TableHead>San pham</TableHead>
                <TableHead>Tong tien</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead>Ngay tao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-sm font-bold">{order.orderCode}</TableCell>
                  <TableCell>
                    {typeof order.user === 'object' && order.user !== null
                      ? (order.user as { username?: string; displayName?: string }).displayName || (order.user as { username?: string }).username
                      : order.user}
                  </TableCell>
                  <TableCell>
                    {order.items.map((item) => item.title).join(', ')}
                  </TableCell>
                  <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[order.status] || ''}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Khong co don hang nao
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
