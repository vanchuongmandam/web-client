// src/app/admin/layout.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

// Đây là "Người Gác Cổng" cho toàn bộ khu vực /admin
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Nếu chưa kiểm tra xong và chưa có user, không làm gì cả, chờ đợi...
    if (isLoading) return;

    // Nếu đã kiểm tra xong mà không có user, đá về trang đăng nhập
    if (!user) {
      router.push('/login');
      return;
    }

  }, [isLoading, user, router]);


  // --- Giao diện trong khi chờ xác thực ---
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  // --- Giao diện khi user không phải là admin ---
  if (user && user.role !== 'admin') {
    return (
       <div className="flex h-[calc(100vh-10rem)] w-full flex-col items-center justify-center text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold text-destructive">Truy cập bị từ chối</h1>
          <p className="mt-2 text-muted-foreground">Bạn không có quyền truy cập vào trang này.</p>
          <button onClick={() => router.push('/')} className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground">
            Quay về Trang chủ
          </button>
      </div>
    );
  }

  // --- Nếu mọi thứ đều ổn (là admin), hiển thị nội dung trang ---
  if (user && user.role === 'admin') {
    return <>{children}</>;
  }

  // Trường hợp dự phòng, không bao giờ nên xảy ra
  return null;
}
