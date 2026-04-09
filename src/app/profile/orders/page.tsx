// src/app/profile/orders/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getUserOrders, cancelOrder } from '@/lib/api';
import type { Order, PaginationMeta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Clock, XCircle } from 'lucide-react';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Chờ thanh toán', variant: 'secondary' },
  paid: { label: 'Đã thanh toán', variant: 'default' },
  confirmed: { label: 'Đã xác nhận', variant: 'default' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
  expired: { label: 'Hết hạn', variant: 'outline' },
  refunded: { label: 'Đã hoàn tiền', variant: 'outline' },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function OrdersPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/login'); return; }

    setLoading(true);
    getUserOrders({ page, limit: 10 }, token)
      .then((res) => {
        setOrders(res.data);
        setPagination(res.pagination);
      })
      .catch(() => toast({ title: 'Lỗi', description: 'Không thể tải danh sách', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [authLoading, token, router, page, toast]);

  const handleCancel = async (orderCode: string) => {
    if (!token) return;
    try {
      await cancelOrder(orderCode, token);
      setOrders((prev) =>
        prev.map((o) => (o.orderCode === orderCode ? { ...o, status: 'cancelled' as const } : o))
      );
      toast({ title: 'Đã hủy', description: 'Đơn hàng đã được hủy' });
    } catch (err: unknown) {
      toast({ title: 'Lỗi', description: err instanceof Error ? err.message : 'Không thể hủy', variant: 'destructive' });
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
        <Package className="h-8 w-8" /> Lịch sử đơn hàng
      </h1>

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Chưa có đơn hàng nào</h2>
          <Button className="mt-4" onClick={() => router.push('/documents')}>
            Khám phá tài liệu
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusMap[order.status] || statusMap.pending;
            return (
              <Card key={order._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">{order.orderCode}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <span className="font-bold">{formatPrice(order.totalAmount)}</span>
                  </div>

                  <div className="mt-3 space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.title}</span>
                        <span className="text-muted-foreground">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  {order.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <Link href={`/documents/${(order.items[0]?.document as string)}/checkout`}>
                        <Button size="sm" variant="outline">
                          <Clock className="mr-1 h-4 w-4" /> Thanh toán
                        </Button>
                      </Link>
                      <Button size="sm" variant="destructive" onClick={() => handleCancel(order.orderCode)}>
                        <XCircle className="mr-1 h-4 w-4" /> Hủy
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
                Trang trước
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>
                Trang sau
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
