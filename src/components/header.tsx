'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose,
  SheetHeader,  // Import thêm
  SheetTitle    // Import thêm
} from '@/components/ui/sheet';
import { Menu, Feather, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const navItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Bài Viết', href: '/articles' },
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href} className="transition-colors hover:text-primary">
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                  <div className="h-9 w-24 rounded-md bg-gray-200 animate-pulse"></div>
                  <div className="h-9 w-24 rounded-md bg-gray-200 animate-pulse"></div>
              </div>
            ) : user ? (
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
                  <DropdownMenuItem asChild><Link href="/profile">Hồ sơ</Link></DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild><Link href="/admin">Trang quản trị</Link></DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild><Link href="/login">Đăng nhập</Link></Button>
                <Button asChild><Link href="/register">Đăng ký</Link></Button>
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
              {/* --- SỬA LỖI TẠI ĐÂY --- */}
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full p-6 pt-0">
                <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.name}>
                      <Link href={item.href} className="transition-colors hover:text-primary">
                        {item.name}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-auto space-y-2">
                   {isLoading ? (
                      <div className="h-9 w-full rounded-md bg-gray-200 animate-pulse"></div>
                   ) : user ? (
                      <>
                        <p className="text-center text-muted-foreground">Chào, {user.username}</p>
                        <Button variant="destructive" className="w-full" onClick={logout}>Đăng xuất</Button>
                      </>
                   ) : (
                     <>
                       <SheetClose asChild>
                         <Button variant="ghost" className="w-full" asChild><Link href="/login">Đăng nhập</Link></Button>
                       </SheetClose>
                       <SheetClose asChild>
                         <Button className="w-full" asChild><Link href="/register">Đăng ký</Link></Button>
                       </SheetClose>
                     </>
                   )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
