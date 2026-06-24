// src/app/profile/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  User,
  ShieldCheck,
  Wallet,
  History,
  BookOpen,
  ChevronRight,
  Bookmark,
} from "lucide-react";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const data = await getProfile(token);
      setProfile(data);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin tài khoản.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [authLoading, token, router]);

  if (authLoading || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subRoleLabels: Record<string, string> = {
    reader: "Độc giả",
    author: "Tác giả",
    teacher: "Giáo viên",
    student: "Học sinh",
  };

  const currentSubRole = profile?.subRole || "reader";

  return (
    <div className="min-h-screen bg-background py-8 text-foreground font-sans">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Breadcrumbs & Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground/80">Cài đặt</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Tài khoản cá nhân
              <Badge className="ml-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 capitalize font-bold">
                {subRoleLabels[currentSubRole] || "Người dùng"}
              </Badge>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Quản lý thông tin hồ sơ, số dư tài khoản và các tài liệu mua bán của bạn.
            </p>
          </div>
          <Button
            variant="outline"
            className="border bg-card text-foreground font-bold hover:bg-accent transition-colors shadow-sm"
            onClick={() => router.push("/")}
          >
            ← Trở về
          </Button>
        </div>

        {/* Layout Main Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Sidebar Menu Left (width 3/12 on large screens) */}
          <div className="space-y-6 lg:col-span-3 lg:sticky lg:top-20">
            <div className="bg-card border border-border rounded-md p-4 shadow-sm">

              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">Quản lý tài khoản</p>
              <nav className="space-y-1">
                <Link
                  href="/profile"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${pathname === "/profile"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                >
                  <User className="h-4 w-4 shrink-0" />
                  Thông tin cá nhân
                </Link>
                <Link
                  href="/profile/wallet"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${pathname === "/profile/wallet"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                  Ví cá nhân
                </Link>
                <Link
                  href="/profile/security"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${pathname === "/profile/security"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Mật khẩu & Bảo mật
                </Link>
              </nav>

              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">Thư viện cá nhân</p>
              <nav className="space-y-1">
                <Link
                  href="/profile/purchases"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${pathname === "/profile/purchases"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  Tài liệu đã mua
                </Link>
                <Link
                  href="/profile/bookmarks"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${pathname === "/profile/bookmarks"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                >
                  <Bookmark className="h-4 w-4 shrink-0" />
                  Tài liệu đã lưu
                </Link>
                <Link
                  href="/profile/orders"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${pathname === "/profile/orders"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                >
                  <History className="h-4 w-4 shrink-0" />
                  Lịch sử đơn hàng
                </Link>
              </nav>

              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">Bảo mật tài khoản</p>
              <div className="px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-md text-xs text-primary flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Hệ thống bảo mật chuẩn</span>
              </div>
            </div>
          </div>

          {/* Page Content Right (width 9/12 on large screens) */}
          <div className="lg:col-span-9 w-full min-w-0">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
