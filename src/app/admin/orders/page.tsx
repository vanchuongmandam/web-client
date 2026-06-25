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
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, TimerReset, CheckCircle2, RotateCcw, Search, MoreHorizontal } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-500/5 px-2 py-0.5 rounded-full text-[10px] font-semibold">
          {statusLabels[status]}
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="outline" className="text-zinc-500 border-zinc-200 bg-zinc-500/5 px-2 py-0.5 rounded-full text-[10px] font-medium">
          {statusLabels[status]}
        </Badge>
      );
    case "paid":
    case "confirmed":
      return (
        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-500/5 px-2 py-0.5 rounded-full text-[10px] font-bold">
          {statusLabels[status]}
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-500/5 px-2 py-0.5 rounded-full text-[10px] font-medium">
          {statusLabels[status]}
        </Badge>
      );
    case "refunded":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-500/5 px-2 py-0.5 rounded-full text-[10px] font-medium">
          {statusLabels[status]}
        </Badge>
      );
    default:
      return <Badge variant="outline" className="px-2 py-0.5 rounded-full text-[10px] font-medium">{status}</Badge>;
  }
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  // Details dialog state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const codeMatch = order.orderCode.toLowerCase().includes(term);
      let userMatch = false;

      if (typeof order.user === 'object' && order.user !== null) {
        const u = order.user as { username?: string; displayName?: string; email?: string };
        userMatch =
          (u.username?.toLowerCase().includes(term) || false) ||
          (u.displayName?.toLowerCase().includes(term) || false) ||
          (u.email?.toLowerCase().includes(term) || false);
      } else if (typeof order.user === 'string') {
        userMatch = order.user.toLowerCase().includes(term);
      }

      if (!codeMatch && !userMatch) return false;
    }

    if (orderTypeFilter !== 'all') {
      if (order.orderType !== orderTypeFilter) return false;
    }

    if (paymentMethodFilter !== 'all') {
      if (order.paymentMethod !== paymentMethodFilter) return false;
    }

    return true;
  });

  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'confirmed');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title block matching the style */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Danh sách đơn hàng</h1>
        <p className="text-sm text-muted-foreground">Giám sát giao dịch và trạng thái thanh toán theo thời gian thực.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tổng đơn hàng</CardDescription>
            <CardTitle className="text-2xl font-extrabold tracking-tight mt-1">{pagination?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Doanh thu trên trang hiện tại</CardDescription>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-emerald-600 mt-1">{formatPrice(totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Đơn đang chờ xử lý</CardDescription>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-amber-600 mt-1">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Bar (Placed outside card matching screenshot 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-3xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-zinc-200 bg-white text-foreground w-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter || 'all'}
              onValueChange={(v) => {
                setStatusFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs border-zinc-200 bg-white min-w-[100px] sm:min-w-[125px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={orderTypeFilter}
              onValueChange={setOrderTypeFilter}
            >
              <SelectTrigger className="h-9 text-xs border-zinc-200 bg-white min-w-[100px] sm:min-w-[115px]">
                <SelectValue placeholder="Loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả loại GD</SelectItem>
                <SelectItem value="deposit" className="text-xs">Nạp ví</SelectItem>
                <SelectItem value="purchase" className="text-xs">Mua tài liệu</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={paymentMethodFilter}
              onValueChange={setPaymentMethodFilter}
            >
              <SelectTrigger className="h-9 text-xs border-zinc-200 bg-white min-w-[100px] sm:min-w-[110px]">
                <SelectValue placeholder="Thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả HTTT</SelectItem>
                <SelectItem value="wallet" className="text-xs">Số dư Ví</SelectItem>
                <SelectItem value="sepay" className="text-xs">Cổng SePay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs font-bold text-muted-foreground shrink-0 self-end sm:self-center">
          {filteredOrders.length} / {pagination?.total || 0} đơn hàng
        </div>
      </div>

      {/* Table wrapping card starting directly with headers (matching screenshot 4) */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="w-[15%] text-xs font-semibold py-2.5 text-muted-foreground tracking-normal normal-case">Mã đơn</TableHead>
              <TableHead className="w-[15%] text-xs font-semibold py-2.5 text-muted-foreground tracking-normal normal-case">Loại đơn</TableHead>
              <TableHead className="w-[38%] text-xs font-semibold py-2.5 text-muted-foreground tracking-normal normal-case">Sản phẩm</TableHead>
              <TableHead className="w-[15%] text-xs font-semibold py-2.5 text-muted-foreground tracking-normal normal-case">Tổng tiền</TableHead>
              <TableHead className="w-[11%] text-xs font-semibold py-2.5 text-muted-foreground tracking-normal normal-case">Trạng thái</TableHead>
              <TableHead className="w-[11%] text-xs font-semibold py-2.5 text-muted-foreground tracking-normal normal-case">Ngày tạo</TableHead>
              <TableHead className="w-[5%] text-right text-xs font-semibold py-2.5 text-muted-foreground tracking-normal normal-case pr-4">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order._id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                {/* Code */}
                <TableCell className="py-2.5 font-medium">
                  <span className="font-mono font-bold text-xs bg-muted text-zinc-700 border border-border/50 rounded-md px-1.5 py-0.5">
                    {order.orderCode}
                  </span>
                </TableCell>

                {/* Order Type */}
                <TableCell className="py-2.5">
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded-full border border-opacity-50",
                    order.orderType === "deposit"
                      ? "bg-blue-500/5 text-blue-600 border-blue-200"
                      : "bg-purple-500/5 text-purple-600 border-purple-200"
                  )}>
                    {order.orderType === "deposit" ? "Nạp ví" : "Mua TL"}
                  </Badge>
                </TableCell>

                {/* Items */}
                <TableCell className="py-2.5 max-w-[220px] truncate text-xs text-muted-foreground font-medium">
                  {order.items.map((item) => item.title).join(', ') || "Nạp số dư ví"}
                </TableCell>

                {/* Price */}
                <TableCell className="py-2.5 font-bold text-xs text-foreground tabular-nums">{formatPrice(order.totalAmount)}</TableCell>
                
                {/* Status */}
                <TableCell className="py-2.5">{statusBadge(order.status)}</TableCell>
                
                {/* Created Date */}
                <TableCell className="py-2.5">
                  <div className="flex flex-col text-[10px] text-muted-foreground font-medium leading-normal">
                    <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span className="text-[9px] opacity-80 mt-0.5">{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="py-2.5 pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-muted rounded-md border border-transparent hover:border-border/30">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tùy chọn</DropdownMenuLabel>
                      
                      <DropdownMenuItem 
                        className="text-xs font-medium cursor-pointer"
                        onClick={() => {
                          setSelectedOrderDetails(order);
                          setIsDetailsOpen(true);
                        }}
                      >
                        Chi tiết
                      </DropdownMenuItem>

                      {(order.status === 'pending' || order.status === 'paid') && (
                        <DropdownMenuItem 
                          className="text-xs font-semibold cursor-pointer text-emerald-600 hover:text-emerald-700"
                          onClick={() => handleAdminConfirm(order.orderCode)}
                        >
                          Xác nhận
                        </DropdownMenuItem>
                      )}

                      {(order.status === 'paid' || order.status === 'confirmed') && (
                        <DropdownMenuItem 
                          className="text-xs font-semibold cursor-pointer text-rose-600 hover:text-rose-700"
                          onClick={() => handleAdminRefund(order.orderCode)}
                        >
                          Hoàn tiền
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2 py-3">
                    <TimerReset className="text-muted-foreground h-8 w-8 opacity-60" />
                    <p className="text-xs font-bold">Không tìm thấy đơn hàng nào khớp với bộ lọc.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pt-2">
          <PaginationControls pagination={pagination} onPageChange={setPage} isLoading={loading} />
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Chi tiết đơn hàng</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Thông tin chi tiết về giao dịch và sản phẩm của đơn hàng.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderDetails && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-3">
                <div>
                  <span className="text-muted-foreground block font-medium">Mã đơn hàng</span>
                  <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 inline-block mt-1">
                    {selectedOrderDetails.orderCode}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Trạng thái</span>
                  <div className="mt-1">
                    {statusBadge(selectedOrderDetails.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-3">
                <div>
                  <span className="text-muted-foreground block font-medium">Khách hàng</span>
                  <span className="font-bold text-foreground mt-1 block">
                    {typeof selectedOrderDetails.user === 'object' && selectedOrderDetails.user !== null
                      ? (selectedOrderDetails.user as { username?: string; displayName?: string }).displayName || (selectedOrderDetails.user as { username?: string }).username
                      : selectedOrderDetails.user}
                  </span>
                  {typeof selectedOrderDetails.user === 'object' && selectedOrderDetails.user !== null && (selectedOrderDetails.user as { email?: string }).email && (
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {(selectedOrderDetails.user as { email?: string }).email}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Loại đơn hàng</span>
                  <span className="font-semibold text-foreground mt-1 block">
                    {selectedOrderDetails.orderType === 'deposit' ? 'Nạp số dư ví' : 'Mua tài liệu'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-3">
                <div>
                  <span className="text-muted-foreground block font-medium">Hình thức thanh toán</span>
                  <span className="font-semibold text-foreground mt-1 block">
                    {selectedOrderDetails.paymentMethod === 'wallet' ? 'Ví số dư' : 'Cổng thanh toán SePay'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Thời gian tạo</span>
                  <span className="font-semibold text-foreground mt-1 block">
                    {new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block font-medium mb-2">Sản phẩm / Dịch vụ</span>
                <div className="bg-zinc-50 rounded-lg border border-border/40 p-3 space-y-2">
                  {selectedOrderDetails.items.length === 0 ? (
                    <div className="font-bold text-foreground py-1">Nạp tiền vào tài khoản</div>
                  ) : (
                    selectedOrderDetails.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-4 py-0.5 border-b border-zinc-100 last:border-0 last:pb-0">
                        <span className="font-medium text-foreground truncate flex-1">{item.title}</span>
                        <span className="font-mono font-bold text-foreground shrink-0">{formatPrice(item.price)}</span>
                      </div>
                    ))
                  )}
                  <div className="border-t border-border/40 pt-2 flex justify-between items-center font-bold text-sm">
                    <span className="text-foreground">Tổng cộng</span>
                    <span className="text-primary font-mono">{formatPrice(selectedOrderDetails.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {selectedOrderDetails.notes && (
                <div className="bg-amber-500/5 border border-amber-200/40 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Ghi chú quản trị</span>
                  <p className="text-amber-900 leading-normal">{selectedOrderDetails.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button size="sm" className="h-9 text-xs font-bold w-full" onClick={() => setIsDetailsOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
