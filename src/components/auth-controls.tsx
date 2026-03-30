// src/components/auth-controls.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, UserPlus, User, BookOpen, ShoppingBag, LayoutDashboard, LogOut } from "lucide-react";

export function AuthControls() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-12 w-28 bg-muted rounded-md animate-pulse"></div>;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Chào, {user.username}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" /> Hồ sơ cá nhân
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/purchases" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" /> Tài liệu đã mua
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/orders" className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4" /> Lịch sử đơn hàng
            </Link>
          </DropdownMenuItem>
          {user.role === "admin" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Trang quản trị
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="flex items-center text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" /> Đăng nhập
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/register">
          <UserPlus className="mr-2 h-4 w-4" /> Đăng ký
        </Link>
      </Button>
    </div>
  );
}
