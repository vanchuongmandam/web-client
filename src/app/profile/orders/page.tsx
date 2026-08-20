// src/app/profile/orders/page.tsx

"use client";

import { toErrorMessage } from "@/lib/errors";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders, cancelOrder } from "@/lib/api";
import type { Order, PaginationMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Clock, XCircle } from "lucide-react";

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'paid':
    case 'confirmed':
      return 'bg-[#3c6b41] text-white hover:bg-[#3c6b41] border-none font-bold text-[10px] px-2 py-0.5 rounded';
    case 'pending':
      return 'bg-amber-600 text-white hover:bg-amber-600 border-none font-bold text-[10px] px-2 py-0.5 rounded';
    case 'cancelled':
      return 'bg-red-700/10 text-red-700 border border-red-200 hover:bg-red-700/15 font-bold text-[10px] px-2 py-0.5 rounded';
    case 'expired':
      return 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-100 font-bold text-[10px] px-2 py-0.5 rounded';
    default:
      return 'bg-[#ebdcb9] text-[#635748] hover:bg-[#ebdcb9] border-none font-bold text-[10px] px-2 py-0.5 rounded';
  }
};

const statusLabels: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
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
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    getUserOrders({ page, limit: 10 }, token)
      .then((res) => {
        setOrders(res.data);
        setPagination(res.pagination);
      })
      .catch(() =>
        toast({ title: "Lỗi", description: "Không thể tải danh sách đơn hàng", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, [authLoading, token, router, page, toast]);

  const handleCancel = async (orderCode: string) => {
    if (!token) return;
    try {
      await cancelOrder(orderCode, token);
      setOrders((prev) =>
        prev.map((o) => (o.orderCode === orderCode ? { ...o, status: "cancelled" as const } : o))
      );
      toast({ title: "Đã hủy", description: "Đơn hàng đã được hủy thành công." });
    } catch (err) {
      toast({
        title: "Lỗi",
        description: toErrorMessage(err, "Không thể hủy đơn hàng"),
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
        <Package className="h-5 w-5 text-primary" /> Lịch sử đơn hàng tài liệu
      </h2>

      {orders.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl bg-muted/10 min-h-[300px] flex flex-col justify-center items-center">
          <Package className="mx-auto mb-3 h-14 w-14 text-primary opacity-25" />
          <h3 className="text-sm font-bold text-foreground">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4 leading-relaxed">
            Các giao dịch mua tài liệu của bạn sẽ hiển thị tại đây.
          </p>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            onClick={() => router.push("/documents")}
          >
            Khám phá tài liệu ngay
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusLabel = statusLabels[order.status] || statusLabels.pending;
            return (
              <Card key={order._id} className="bg-card border border-border shadow-sm rounded-xl">
                <CardContent className="p-4 sm:p-5">
                  
                  {/* Order header information */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-foreground">{order.orderCode}</span>
                        <Badge className={getStatusBadgeClass(order.status)}>
                          {statusLabel}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Khởi tạo lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end sm:self-center">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tổng thanh toán:</span>
                        <span className="font-extrabold text-[#8e2929] text-base">{formatPrice(order.totalAmount - (order.discountAmount || 0))}</span>
                      </div>
                      {order.discountAmount !== undefined && order.discountAmount > 0 && (
                        <span className="text-[10px] text-emerald-600 font-semibold leading-none mt-0.5">
                          (Đã giảm {formatPrice(order.discountAmount)} bằng mã {order.couponCode || ""})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2 py-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs sm:text-sm py-1 border-b border-border/40 last:border-0">
                        <span className="text-stone-700 font-semibold">{item.title}</span>
                        <span className="text-stone-500 font-mono text-xs">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pending actions */}
                  {order.status === "pending" && (
                    <div className="mt-4 flex gap-2 border-t border-border pt-3">
                      <Link href={`/documents/${(order.items[0]?.document as string)}/checkout`}>
                        <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8 shadow-sm">
                          <Clock className="mr-1 h-3.5 w-3.5" /> Đi đến Thanh toán
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border border-border bg-transparent text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/10 font-bold text-xs h-8"
                        onClick={() => handleCancel(order.orderCode)}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Hủy đơn hàng này
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="border border-border bg-card text-primary font-bold hover:bg-accent text-xs rounded"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </Button>
              <span className="flex items-center text-xs text-muted-foreground px-3 font-semibold">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border border-border bg-card text-primary font-bold hover:bg-accent text-xs rounded"
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
