// src/components/header.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Menu, LogIn, UserPlus, Search, LayoutGrid } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Category } from '@/lib/types';
import Logo from '@/assets/logo/vanchuongmandam-logo.svg';
import LogoText from '@/assets/logo/vanchuongmandam-chu.svg';
import BannerImage from '@/assets/logo/banner.webp';



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

  return (
    <>
      <div 
        className="relative overflow-hidden border-b" 
        style={{ backgroundImage: `url(${BannerImage.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-card/50 backdrop-blur-sm z-0"></div>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative z-10">
            <Link href="/" className="flex items-center gap-3">
              <Image src={Logo} alt="vanchuongmandam" height={120} />
              <Image src={LogoText} alt="vanchuongmandam" height={150} />
            </Link>

            <div className="flex items-center gap-4">
              {/* Auth Section for Desktop */}
              <div className="hidden sm:flex items-center">
                {isLoading ? (
                  <div className="h-12 w-28 bg-muted rounded-md animate-pulse"></div>
                ) : user ? (
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
                ) : (
                  <div className="flex flex-col gap-1.5 items-end">
                     <Button asChild variant="ghost" size="sm">
                        <Link href="/login"><LogIn className="mr-2 h-4 w-4"/>Đăng nhập</Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href="/register"><UserPlus className="mr-2 h-4 w-4"/>Đăng ký</Link>
                    </Button>
                  </div>
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
                          <div className="space-y-2">
                            <SheetClose asChild><Button asChild className="w-full justify-start" variant="ghost"><Link href="/login"><LogIn className="mr-2 h-4 w-4"/>Đăng nhập</Link></Button></SheetClose>
                            <SheetClose asChild><Button asChild className="w-full justify-start"><Link href="/register"><UserPlus className="mr-2 h-4 w-4"/>Đăng ký</Link></Button></SheetClose>
                          </div>
                        )}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>

      {/* Bottom Bar - Sticky */}
      <nav className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b">
          <div className="container mx-auto px-4 hidden md:flex items-center justify-between h-14 text-sm font-medium">
            {/* Left side: Category Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm"><LayoutGrid className="mr-2 h-4 w-4"/> Danh mục</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto" align="start">
                    <div className="grid grid-flow-col auto-cols-max gap-x-8 gap-y-4">
                        {parentCategories.map((parent) => (
                            <div key={parent._id} className="flex flex-col space-y-2">
                                <Link href={`/articles?category=${parent.slug}`} className="font-bold text-base hover:text-primary transition-colors">{parent.name}</Link>
                                <div className="flex flex-col space-y-1.5">
                                    {parent.children?.map((child) => (
                                        <Link key={child._id} href={`/articles?category=${child.slug}`} className="text-muted-foreground hover:text-primary transition-colors">{child.name}</Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Center: Main Navigation Links */}
            <div className="flex items-center gap-1">
              <Link href="/" className="transition-colors hover:text-primary px-2 py-2 rounded-md">Trang chủ</Link>
              {parentCategories.map((category) => (
                <Link key={category._id} href={`/articles?category=${category.slug}`} className="transition-colors hover:text-primary px-2 py-2 rounded-md">
                  {category.name}
                </Link>
              ))}
            </div>
            
            {/* Right side: Search Button */}
            <Button variant="ghost" size="icon"><Search className="h-5 w-5"/></Button>
          </div>
      </nav>
    </>
  );
}
