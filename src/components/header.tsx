// src/components/header.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from '@/components/ui/sheet';
import { Menu, LogIn, UserPlus, Search, LayoutGrid } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { getCategories } from '@/lib/api';
import type { Category } from '@/lib/types';
import Logo from '@/assets/logo/vanchuongmandam-logo.svg';
import LogoText from '@/assets/logo/vanchuongmandam-chu.svg';
import BannerImage from '@/assets/logo/banner.webp';

export async function Header() {
  const parentCategories: Category[] = await getCategories();

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

            {/* Auth + Mobile nav... (có thể giữ nguyên code bạn) */}
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
