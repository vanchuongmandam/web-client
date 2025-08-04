'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Feather, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


// Cập nhật link cho "Bài Viết"
const navItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Bài Viết', href: '/articles' }, // Sửa ở đây
  { name: 'Sách Hay', href: '#' },
  { name: 'Tác Giả', href: '#' },
  { name: 'Liên Hệ', href: '#' },
];

export function Header() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Feather className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-bold text-primary whitespace-nowrap">
              Văn Chương Mạn Đàm
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {isLoading ? (
              // Hiển thị skeleton loading khi đang kiểm tra auth
              <div className="flex items-center gap-2">
                  <div className="h-9 w-24 rounded-md bg-gray-200 animate-pulse"></div>
                  <div className="h-9 w-24 rounded-md bg-gray-200 animate-pulse"></div>
              </div>
            ) : user ? (
              // Nếu đã đăng nhập, hiển thị avatar và menu
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>Chào, {user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile">Hồ sơ</Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem>
                      <Link href="/admin">Trang quản trị</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Nếu chưa đăng nhập, hiển thị nút Đăng nhập/Đăng ký
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
               {/* ... (phần mobile menu giữ nguyên logic tương tự) ... */}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
