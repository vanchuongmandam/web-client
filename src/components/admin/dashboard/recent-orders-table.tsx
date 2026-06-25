"use client";

import Link from "next/link";
import { CheckCircle2, RotateCcw, ArrowRight, Clock, XCircle, ShoppingBag } from "lucide-react";

import type { AdminDashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ TT",
  paid: "Đã TT",
  confirmed: "Xác nhận",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Hoàn tiền",
};

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-500/5 px-2 py-0.5 rounded-full text-[10px] font-medium">
          {STATUS_LABEL[status]}
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="outline" className="text-zinc-500 border-zinc-200 bg-zinc-500/5 px-2 py-0.5 rounded-full text-[10px] font-medium">
          {STATUS_LABEL[status]}
        </Badge>
      );
    case "paid":
    case "confirmed":
      return (
        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-500/5 px-2 py-0.5 rounded-full text-[10px] font-semibold">
          {STATUS_LABEL[status]}
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-500/5 px-2 py-0.5 rounded-full text-[10px] font-medium">
          {STATUS_LABEL[status]}
        </Badge>
      );
    case "refunded":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-500/5 px-2 py-0.5 rounded-full text-[10px] font-medium">
          {STATUS_LABEL[status]}
        </Badge>
      );
    default:
      return <Badge variant="outline" className="px-2 py-0.5 rounded-full text-[10px] font-medium">{status}</Badge>;
  }
}

function getOrderIcon(status: string) {
  switch (status) {
    case "pending":
      return <Clock className="size-3" />;
    case "paid":
    case "confirmed":
      return <CheckCircle2 className="size-3" />;
    case "refunded":
      return <RotateCcw className="size-3" />;
    case "cancelled":
    case "expired":
      return <XCircle className="size-3" />;
    default:
      return <ShoppingBag className="size-3" />;
  }
}

const vndFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

interface RecentOrdersTableProps {
  orders: AdminDashboardStats["recentOrders"];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const displayOrders = orders.slice(0, 20);

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-sm h-[370px] flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">Đơn hàng gần đây</CardTitle>
        </CardHeader>

        <CardContent className="px-3 py-0">
          {displayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
              <span className="text-xs">Chưa có đơn hàng nào</span>
            </div>
          ) : (
            <ScrollArea className="h-[260px] pr-1">
              <Table>
                <TableHeader className="bg-card sticky top-0 z-20 hover:bg-transparent">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="text-xs font-semibold py-2 w-[28%] bg-muted/20 text-muted-foreground">Mã đơn</TableHead>
                    <TableHead className="text-xs font-semibold py-2 w-[28%] bg-muted/20 text-muted-foreground">Khách hàng</TableHead>
                    <TableHead className="text-xs font-semibold py-2 w-[18%] bg-muted/20 text-muted-foreground">Loại đơn</TableHead>
                    <TableHead className="text-xs font-semibold py-2 text-right w-[16%] bg-muted/20 text-muted-foreground">Tiền</TableHead>
                    <TableHead className="text-xs font-semibold py-2 text-center w-[10%] bg-muted/20 text-muted-foreground">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                      {/* Order Code */}
                      <TableCell className="font-mono text-xs py-2 w-[28%] overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              "size-5 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                              order.status === "paid" || order.status === "confirmed"
                                ? "bg-green-50 text-green-600 border border-green-100"
                                : order.status === "pending"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : order.status === "refunded"
                                ? "bg-blue-50 text-blue-600 border border-blue-100"
                                : "bg-zinc-50 text-zinc-500 border border-zinc-200"
                            )}
                          >
                            {getOrderIcon(order.status)}
                          </div>
                          <span className="truncate max-w-[85px] font-bold text-zinc-700 dark:text-zinc-300">{order.orderCode}</span>
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="text-xs text-muted-foreground font-medium py-2 truncate max-w-[100px] w-[28%]">
                        {order.user?.username || "Không rõ"}
                      </TableCell>

                      {/* Order Type */}
                      <TableCell className="py-2 w-[18%]">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-opacity-50",
                          order.orderType === "deposit"
                            ? "bg-blue-500/5 text-blue-600 border-blue-200"
                            : "bg-purple-500/5 text-purple-600 border-purple-200"
                        )}>
                          {order.orderType === "deposit" ? "Nạp ví" : "Mua TL"}
                        </Badge>
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="text-xs font-bold tabular-nums text-right py-2 w-[16%]">
                        {vndFormat.format(order.totalAmount)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center py-2 w-[10%]">
                        <div className="scale-90 inline-block">
                          {statusBadge(order.status)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </div>

      <CardFooter className="justify-center border-t border-border/40 py-2">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground">
          <Link href="/admin/orders">
            Xem tất cả đơn hàng
            <ArrowRight className="size-3.5 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

