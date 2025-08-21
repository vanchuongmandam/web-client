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
import { LogIn, UserPlus } from "lucide-react";

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
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Chào, {user.username}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.role === "admin" && (
            <DropdownMenuItem asChild>
              <Link href="/admin">Trang quản trị</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={logout}>Đăng xuất</DropdownMenuItem>
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
