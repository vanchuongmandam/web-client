// src/app/admin/orders/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAdminOrders, confirmAdminOrder, refundAdminOrder } from '@/lib/api';
import type { Order, PaginationMeta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, TimerReset, CheckCircle2, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PaginationControls } from '@/components/ui/pagination-controls';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
  refunded: 'Đã hoàn tiền',
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
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách đơn hàng', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter, toast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleAdminConfirm = async (orderCode: string) => {
    if (!token) return;
    const note = window.prompt('Ghi chú xác nhận thủ công (có thể bỏ trống):', '');
    if (note === null) return;

    try {
      await confirmAdminOrder(orderCode, token, note || undefined);
      toast({ title: 'Đã xác nhận', description: 'Đơn hàng đã được xác nhận thủ công.' });
      loadOrders();
    } catch (err: unknown) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể xác nhận đơn hàng',
        variant: 'destructive',
      });
    }
  };

  const handleAdminRefund = async (orderCode: string) => {
    if (!token) return;
    const shouldRefund = window.confirm('Bạn có chắc muốn hoàn tiền và thu hồi quyền truy cập của đơn hàng này?');
    if (!shouldRefund) return;

    const note = window.prompt('Ghi chú hoàn tiền (không bắt buộc):', '');
    if (note === null) return;

    try {
      await refundAdminOrder(orderCode, token, note || undefined);
      toast({ title: 'Đã hoàn tiền', description: 'Đơn hàng đã được hoàn tiền.' });
      loadOrders();
    } catch (err: unknown) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể hoàn tiền',
        variant: 'destructive',
      });
    }
  };

  // Calculate revenue stats from current page (simplified)
  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'confirmed');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="rounded-xl border bg-card p-5">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <Package />
          Quản lý đơn hàng
        </h1>
        <p className="text-sm text-muted-foreground">
          Giám sát giao dịch marketplace và trạng thái thanh toán theo thời gian thực.
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng đơn hàng</CardDescription>
            <CardTitle className="text-2xl">{pagination?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Doanh thu trên trang hiện tại</CardDescription>
            <CardTitle className="text-2xl">{formatPrice(totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đơn đang chờ xử lý</CardDescription>
            <CardTitle className="text-2xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách đơn hàng</CardTitle>
          <CardDescription>Lọc theo trạng thái để ưu tiên xử lý nhanh.</CardDescription>
          <Separator />
          <Select
            value={statusFilter || 'all'}
            onValueChange={(v) => {
              setStatusFilter(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
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
                    <Badge variant={order.status === 'cancelled' || order.status === 'expired' ? 'destructive' : 'secondary'}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {(order.status === 'pending' || order.status === 'paid') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdminConfirm(order.orderCode)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Xác nhận
                        </Button>
                      )}

                      {(order.status === 'paid' || order.status === 'confirmed') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAdminRefund(order.orderCode)}
                        >
                          <RotateCcw className="mr-1 h-4 w-4" />
                          Hoàn tiền
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 py-3">
                      <TimerReset className="text-muted-foreground" />
                      <p>Không có đơn hàng nào trong bộ lọc hiện tại.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <PaginationControls pagination={pagination} onPageChange={setPage} isLoading={loading} />
      )}
    </div>
  );
}
