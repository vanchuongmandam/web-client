// src/app/admin/layout.tsx
"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="admin-layout flex h-screen w-full items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  if (user && user.role !== "admin") {
    return (
      <div className="admin-layout flex min-h-screen w-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 size-12 text-destructive" />
          <h1 className="text-2xl font-bold text-destructive">Truy cập bị từ chối</h1>
          <p className="mt-2 text-muted-foreground">Bạn không có quyền truy cập vào khu vực admin.</p>
          <Button onClick={() => router.push("/")} className="mt-6 w-full">
            <ArrowLeft data-icon="inline-start" />
            Quay về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  if (user && user.role === "admin") {
    return (
      <div className="admin-layout w-full min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur">
              <div className="flex h-14 items-center gap-3 border-b px-4 lg:px-6">
                <SidebarTrigger />
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Bảng điều khiển admin</span>
                  <Badge variant="outline">Marketplace</Badge>
                </div>
              </div>
            </header>
            <main className="min-h-[calc(100vh-56px)] bg-muted/20 p-4 lg:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    );
  }

  return null;
}
