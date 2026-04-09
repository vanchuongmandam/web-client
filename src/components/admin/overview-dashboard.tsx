"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  DollarSign,
  Download,
  Loader2,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { getAdminStats } from "@/lib/api";
import type { AdminDashboardStats } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CardDescription, Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

const revenueConfig = {
  revenue: {
    label: "Doanh thu (VNĐ)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const activityConfig = {
  orders: {
    label: "Đơn hàng",
    color: "hsl(var(--primary))",
  },
  purchases: {
    label: "Lượt mua",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}%`;
}

export function OverviewDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getAdminStats(token)
      .then((data) => setStats(data))
      .catch((err: unknown) => {
        toast({
          title: "Lỗi",
          description: err instanceof Error ? err.message : "Không thể tải số liệu dashboard",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [token, toast]);

  const kpis = useMemo(() => {
    if (!stats) return [];

    return [
      {
        title: "Tổng doanh thu",
        value: formatPrice(stats.summary.totalRevenue),
        delta: `${formatDelta(stats.deltas.revenueMoM)} so với tháng trước`,
        icon: DollarSign,
      },
      {
        title: "Tổng đơn hàng",
        value: stats.summary.totalOrders.toLocaleString("vi-VN"),
        delta: `${formatDelta(stats.deltas.ordersMoM)} so với tháng trước`,
        icon: ShoppingCart,
      },
      {
        title: "Tài liệu trong hệ thống",
        value: stats.summary.totalDocuments.toLocaleString("vi-VN"),
        delta: `${stats.summary.pendingOrders.toLocaleString("vi-VN")} đơn đang chờ xử lý`,
        icon: BookOpen,
      },
      {
        title: "Lượt tải tài liệu",
        value: stats.summary.totalDownloads.toLocaleString("vi-VN"),
        delta: `${stats.summary.paidOrders.toLocaleString("vi-VN")} đơn đã thanh toán`,
        icon: Download,
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="mb-8 flex h-44 items-center justify-center rounded-xl border bg-card">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mb-8 rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Không có dữ liệu thống kê để hiển thị.</p>
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex flex-col gap-1">
                <CardDescription>{kpi.title}</CardDescription>
                <CardTitle className="text-2xl">{kpi.value}</CardTitle>
              </div>
              <kpi.icon className="text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">{kpi.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Doanh thu 6 tháng</CardTitle>
              <Badge variant="secondary">Revenue</Badge>
            </div>
            <CardDescription>Thống kê doanh thu từ các đơn đã thanh toán/xác nhận.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="min-h-[260px] w-full max-h-[320px]">
              <BarChart accessibilityLayer data={stats.revenueByMonth}>
                <CartesianGrid vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              {stats.deltas.revenueMoM >= 0 ? (
                <>
                  Tăng trưởng tháng này {formatDelta(stats.deltas.revenueMoM)} <TrendingUp />
                </>
              ) : (
                <>
                  Giảm {formatDelta(stats.deltas.revenueMoM)} so với tháng trước <TrendingDown />
                </>
              )}
            </div>
            <div className="leading-none text-muted-foreground">Dữ liệu được tổng hợp trực tiếp từ đơn hàng marketplace.</div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Xu hướng đơn hàng và lượt mua</CardTitle>
              <Badge variant="secondary">Activity</Badge>
            </div>
            <CardDescription>So sánh số đơn tạo mới và lượt mua tài liệu theo tháng.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityConfig} className="min-h-[260px] w-full max-h-[320px]">
              <LineChart
                accessibilityLayer
                data={stats.activityByMonth}
                margin={{
                  left: 12,
                  right: 12,
                  top: 10,
                }}
              >
                <CartesianGrid vertical={false} opacity={0.3} />
                <YAxis tickLine={false} axisLine={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line dataKey="orders" type="monotone" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
                <Line dataKey="purchases" type="monotone" stroke="var(--color-purchases)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="leading-none text-muted-foreground">Giúp theo dõi nhịp tăng trưởng giao dịch để tối ưu chiến dịch nội dung.</div>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tài liệu bán chạy</CardTitle>
          <CardDescription>Top 5 tài liệu theo số lượt mua.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.topDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu bán hàng.</p>
          ) : (
            stats.topDocuments.map((doc, idx) => (
              <div key={doc.documentId} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">#{idx + 1} {doc.title}</p>
                  <p className="text-sm text-muted-foreground">{doc.purchaseCount} lượt mua</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{formatPrice(doc.revenue)}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/documents/${doc.slug}`}>Xem</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
