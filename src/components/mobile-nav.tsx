"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Menu, BookOpen, ChevronRight, Home, Layers } from "lucide-react";
import type { Category } from "@/lib/types";
import { AuthControls } from "@/components/auth-controls";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  parentCategories: Category[];
}

export function MobileNav({ parentCategories }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const isHomeActive = pathname === "/" && !currentCategory;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 rounded-md"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Mở menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border/60 text-left">
          <SheetTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Văn Chương Mạn Đàm</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {/* Trang chủ */}
          <SheetClose asChild>
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isHomeActive
                  ? "text-primary font-semibold"
                  : "text-foreground hover:text-primary"
              )}
            >
              <Home className="h-4 w-4" />
              <span>Trang chủ</span>
            </Link>
          </SheetClose>

          {/* Kho tài liệu */}
          <SheetClose asChild>
            <Link
              href="/documents"
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith("/documents")
                  ? "text-primary font-semibold"
                  : "text-foreground hover:text-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Kho tài liệu</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                Hot
              </span>
            </Link>
          </SheetClose>

          <div className="my-2 border-t border-border/60" />

          {/* Danh mục danh sách */}
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1">
            Chuyên mục
          </div>

          <Accordion type="multiple" className="w-full">
            {parentCategories.map((category) => {
              const hasChildren = Boolean(
                category.children && category.children.length > 0
              );
              const isParentActive =
                currentCategory === category.slug ||
                category.children?.some((c) => c.slug === currentCategory);

              if (!hasChildren) {
                return (
                  <div key={category._id} className="py-1">
                    <SheetClose asChild>
                      <Link
                        href={`/articles?category=${category.slug}`}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors",
                          isParentActive
                            ? "text-primary font-semibold"
                            : "text-foreground hover:text-primary"
                        )}
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </SheetClose>
                  </div>
                );
              }

              return (
                <AccordionItem
                  key={category._id}
                  value={category._id}
                  className="border-b-0 py-0.5"
                >
                  <AccordionTrigger
                    className={cn(
                      "px-3 py-2 text-sm font-medium hover:no-underline transition-colors",
                      isParentActive ? "text-primary font-semibold" : "text-foreground hover:text-primary"
                    )}
                  >
                    <span>{category.name}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-1 pl-4 pr-1 flex flex-col gap-1.5">
                    <SheetClose asChild>
                      <Link
                        href={`/articles?category=${category.slug}`}
                        className="text-xs font-semibold text-primary hover:underline transition-colors py-1 block"
                      >
                        Tất cả {category.name}
                      </Link>
                    </SheetClose>
                    {category.children.map((child) => {
                      const isChildActive = currentCategory === child.slug;
                      return (
                        <SheetClose asChild key={child._id}>
                          <Link
                            href={`/articles?category=${child.slug}`}
                            className={cn(
                              "text-xs transition-colors py-1 block",
                              isChildActive
                                ? "text-primary font-semibold"
                                : "text-muted-foreground hover:text-primary"
                            )}
                          >
                            {child.name}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Footer: Auth Controls */}
        <div className="p-4 border-t border-border/60 bg-muted/20">
          <AuthControls />
        </div>
      </SheetContent>
    </Sheet>
  );
}
