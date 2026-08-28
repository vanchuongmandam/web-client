"use client";

import {
  DollarSign,
  ShoppingCart,
  Clock,
  BookOpen,
  Download,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminDashboardStats } from "@/lib/types";

interface KpiCardsProps {
  stats: AdminDashboardStats;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

const formatDelta = (value: number) => {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
};

function DeltaBadge({ value }: { value: number }) {
  const isPositive = value >= 0;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 text-xs font-medium",
        isPositive
          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15"
          : "bg-red-500/10 text-red-600 hover:bg-red-500/15"
      )}
    >
      {isPositive ? (
        <TrendingUp data-icon="inline-start" />
      ) : (
        <TrendingDown data-icon="inline-start" />
      )}
      {formatDelta(value)}
    </Badge>
  );
}

export function KpiCards({ stats }: KpiCardsProps) {
  const { summary, deltas } = stats;

  const cards = [
    {
      label: "Tổng doanh thu",
      value: formatPrice(summary.totalRevenue),
      icon: DollarSign,
      iconClass: "bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      footer: <DeltaBadge value={deltas.revenueMoM} />,
      warning: false,
    },
    {
      label: "Tổng đơn hàng",
      value: summary.totalOrders.toLocaleString("vi-VN"),
      icon: ShoppingCart,
      iconClass: "bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
      footer: <DeltaBadge value={deltas.ordersMoM} />,
      warning: false,
    },
    {
      label: "Đang chờ xử lý",
      value: summary.pendingOrders.toLocaleString("vi-VN"),
      icon: Clock,
      iconClass: cn(
        summary.pendingOrders > 0
          ? "bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
          : "bg-zinc-50 text-zinc-500 border border-zinc-200/50 dark:bg-zinc-800 dark:text-zinc-400"
      ),
      footer:
        stats.pendingAccessRequests > 0 ? (
          <Badge
            variant="secondary"
            className="bg-amber-50 text-amber-600 border border-amber-100/50 hover:bg-amber-100/80 text-[9px] font-bold px-1.5 py-0"
          >
            + {stats.pendingAccessRequests} yêu cầu
          </Badge>
        ) : null,
      warning: summary.pendingOrders > 0,
    },
    {
      label: "Tài liệu",
      value: summary.totalDocuments.toLocaleString("vi-VN"),
      icon: BookOpen,
      iconClass: "bg-indigo-50 text-indigo-600 border border-indigo-100/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
      footer: <span className="text-[10px] font-semibold text-muted-foreground/80">Kho tài liệu</span>,
      warning: false,
    },
    {
      label: "Lượt tải",
      value: summary.totalDownloads.toLocaleString("vi-VN"),
      icon: Download,
      iconClass: "bg-teal-50 text-teal-600 border border-teal-100/50 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30",
      footer: (
        <span className="text-[10px] font-semibold text-muted-foreground/80">
          {summary.paidOrders.toLocaleString("vi-VN")} đơn đã TT
        </span>
      ),
      warning: false,
    },
    {
      label: "Người dùng",
      value: summary.totalUsers.toLocaleString("vi-VN"),
      icon: Users,
      iconClass: "bg-purple-50 text-purple-600 border border-purple-100/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30",
      footer: (
        <span className="text-[10px] font-semibold text-muted-foreground/80">
          +{summary.newUsersThisMonth.toLocaleString("vi-VN")} tháng này
        </span>
      ),
      warning: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={cn(
              "rounded-xl border border-border/60 bg-card shadow-sm flex flex-col justify-between h-[120px] overflow-hidden",
              card.warning && "border-amber-500/40 ring-1 ring-amber-500/10 bg-amber-50/5"
            )}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full w-full">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                  {card.label}
                </span>
                <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", card.iconClass)}>
                  <Icon className="size-4" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-2xl font-extrabold tracking-tight text-foreground truncate leading-none">
                  {card.value}
                </span>
                <div className="flex items-center h-4 mt-1.5">
                  {card.footer}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
