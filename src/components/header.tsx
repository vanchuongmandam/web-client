// src/components/header.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Menu, Feather } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from '@/lib/types';

const navItems = [
  { name: 'Trang chủ', href: '/' },
  // Đã xóa "Tất cả bài viết"
];

async function getCategories(): Promise<Category[]> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/categories`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setParentCategories);
  }, []);

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
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href} className="transition-colors hover:text-primary px-1 py-0 rounded-md">
                {item.name}
              </Link>
            ))}
            {parentCategories.map((category) => (
              <Link key={category._id} href={`/articles?category=${category.slug}`} className="transition-colors hover:text-primary px-2 py-2 rounded-md">
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Auth Section */}
            <div className="hidden sm:block">
              {isLoading ? (
                <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Chào, {user.username}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Trang quản trị</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={logout}>Đăng xuất</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
              )}
            </div>

            {/* Mobile Navigation Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Mở menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="grid gap-4 py-6">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.name}>
                      <Link href={item.href} className="flex w-full items-center py-2 text-lg font-semibold">
                        {item.name}
                      </Link>
                    </SheetClose>
                  ))}
                  {parentCategories.map((item) => (
                    <SheetClose asChild key={item._id}>
                      <Link href={`/articles?category=${item.slug}`} className="flex w-full items-center py-2 text-lg font-semibold">
                        {item.name}
                      </Link>
                    </SheetClose>
                  ))}
                  
                   <div className="sm:hidden pt-4 border-t">
                      {user ? (
                        <div className="space-y-2">
                          <p className="font-semibold">{user.username}</p>
                           {user.role === 'admin' && <SheetClose asChild><Link href="/admin" className="block w-full">Trang quản trị</Link></SheetClose>}
                          <Button onClick={logout} variant="ghost" className="w-full justify-start p-0">Đăng xuất</Button>
                        </div>
                      ) : (
                         <SheetClose asChild><Button asChild className="w-full"><Link href="/login">Đăng nhập</Link></Button></SheetClose>
                      )}
                   </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
