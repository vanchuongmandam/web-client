"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getAdminStats } from "@/lib/api";
import type { AdminDashboardStats } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

import { KpiCards } from "@/components/admin/dashboard/kpi-cards";
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { OrderStatusChart } from "@/components/admin/dashboard/order-status-chart";
import { RecentOrdersTable } from "@/components/admin/dashboard/recent-orders-table";
import { TopDocumentsTable } from "@/components/admin/dashboard/top-documents-table";
import { ActivityChart } from "@/components/admin/dashboard/activity-chart";
import { CouponPerformance } from "@/components/admin/dashboard/coupon-performance";
import { DashboardSkeleton } from "@/components/admin/dashboard/dashboard-skeleton";

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  const fetchStats = useCallback(
    async (silent = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }
      try {
        const data = await getAdminStats(token);
        setStats(data);
      } catch (err: unknown) {
        toast({
          title: "Lỗi",
          description: err instanceof Error ? err.message : "Không thể tải số liệu dashboard",
          variant: "destructive",
        });
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [token, toast]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 rounded-xl border bg-card p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Admin dashboard</Badge>
            <Badge variant="outline">Marketplace</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Trang quản trị</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Đang tải dữ liệu tổng quan...
          </p>
        </header>
        <DashboardSkeleton />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 rounded-xl border bg-card p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Admin dashboard</Badge>
            <Badge variant="outline">Marketplace</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Trang quản trị</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Không có dữ liệu thống kê để hiển thị.
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 py-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>Admin Dashboard</span>
          <span>•</span>
          <span>Marketplace</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Trang quản trị</h1>
        <p className="text-sm text-muted-foreground">
          Khu vực điều phối nội dung và marketplace. Tổng quan thống kê và xử lý nhanh giao dịch.
        </p>
      </div>

      {/* Row 1: KPI Cards */}
      <KpiCards stats={stats} />

      {/* Row 2: Charts (col-span-3 for Revenue, col-span-2 for Order Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RevenueChart data={stats.revenueByMonth} revenueMoM={stats.deltas.revenueMoM} />
        </div>
        <div className="lg:col-span-2">
          <OrderStatusChart breakdown={stats.orderStatusBreakdown} paymentMethod={stats.revenueByPaymentMethod} />
        </div>
      </div>

      {/* Row 3: 2 Tables (Recent Orders col-span-3, Top Documents col-span-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentOrdersTable
            orders={stats.recentOrders}
          />
        </div>
        <div className="lg:col-span-2">
          <TopDocumentsTable documents={stats.topDocuments} />
        </div>
      </div>

      {/* Row 4: 2 panels (col-span-3 for Activity Trend, col-span-2 for Coupon Performance) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ActivityChart data={stats.activityByMonth} />
        </div>
        <div className="lg:col-span-2">
          <CouponPerformance coupons={stats.couponStats} />
        </div>
      </div>
    </div>
  );
}
