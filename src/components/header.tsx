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
import { Menu, Feather, LogIn, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Trang chủ', href: '/' },
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

  const renderNavLinks = (isMobile = false) => (
    <>
      {navItems.map((item) => 
        isMobile ? (
          <SheetClose asChild key={item.name}>
            <Button variant="ghost" asChild className="w-full justify-start py-4 text-lg">
              <Link href={item.href}>{item.name}</Link>
            </Button>
          </SheetClose>
        ) : (
          <Button variant="ghost" asChild key={item.name}>
            <Link href={item.href}>{item.name}</Link>
          </Button>
        )
      )}
      {parentCategories.map((category) =>
        isMobile ? (
          <SheetClose asChild key={category._id}>
            <Button variant="ghost" asChild className="w-full justify-start py-4 text-lg">
              <Link href={`/articles?category=${category.slug}`}>{category.name}</Link>
            </Button>
          </SheetClose>
        ) : (
          <Button variant="ghost" asChild key={category._id}>
            <Link href={`/articles?category=${category.slug}`}>{category.name}</Link>
          </Button>
        )
      )}
    </>
  );
  
  const renderAuthControls = (isMobile = false) => {
    if (isLoading) {
      return <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>;
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
            {user.role === 'admin' && (
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
      <div className={cn("flex items-center gap-2", isMobile && "flex-col w-full")}>
        <Button asChild variant="ghost" className={cn(isMobile && "w-full justify-start")}><Link href="/login"><LogIn />Đăng nhập</Link></Button>
        <Button asChild className={cn(isMobile && "w-full justify-start")}><Link href="/register"><UserPlus />Đăng ký</Link></Button>
      </div>
    );
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4 flex h-20 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Feather className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary whitespace-nowrap hidden sm:inline">
            Văn Chương Mạn Đàm
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {renderNavLinks(false)}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center">
          {renderAuthControls(false)}
        </div>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Mở menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm flex flex-col p-0">
                 <div className="p-4 border-b">
                    <SheetClose asChild>
                        <Link href="/" className="flex items-center gap-3">
                          <Feather className="h-8 w-8 text-primary" />
                          <span className="font-headline text-2xl font-bold text-primary whitespace-nowrap">
                            Văn Chương Mạn Đàm
                          </span>
                        </Link>
                    </SheetClose>
                 </div>
                 <nav className="flex-grow flex flex-col gap-2 p-4">
                   {renderNavLinks(true)}
                 </nav>
                 <div className="p-4 border-t">
                   {renderAuthControls(true)}
                 </div>
              </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
