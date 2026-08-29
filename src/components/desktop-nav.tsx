"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DesktopNavProps {
  parentCategories: Category[];
}

function DesktopNavContent({ parentCategories }: DesktopNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const isHomeActive = pathname === "/" && !currentCategory;

  return (
    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
      {/* Trang chủ */}
      <Link
        href="/"
        className={cn(
          "py-2 text-sm select-none",
          isHomeActive
            ? "text-primary font-semibold"
            : "text-foreground hover:text-primary font-medium"
        )}
      >
        Trang chủ
      </Link>

      {/* Danh mục cha */}
      {parentCategories.map((category) => {
        const hasChildren = Boolean(
          category.children && category.children.length > 0
        );
        const isCurrentParentActive =
          currentCategory === category.slug ||
          category.children?.some((c) => c.slug === currentCategory);

        if (!hasChildren) {
          return (
            <Link
              key={category._id}
              href={`/articles?category=${category.slug}`}
              className={cn(
                "py-2 text-sm select-none",
                isCurrentParentActive
                  ? "text-primary font-semibold"
                  : "text-foreground hover:text-primary font-medium"
              )}
            >
              {category.name}
            </Link>
          );
        }

        return (
          <div key={category._id} className="relative group">
            {/* Nút danh mục cha */}
            <Link
              href={`/articles?category=${category.slug}`}
              className={cn(
                "py-2 text-sm select-none block",
                isCurrentParentActive
                  ? "text-primary font-semibold"
                  : "text-foreground hover:text-primary group-hover:text-primary font-medium"
              )}
            >
              {category.name}
            </Link>

            {/* Menu con dropdown gắn trực tiếp bên dưới danh mục cha - không animation */}
            <div
              className={cn(
                "absolute top-full left-0 pt-2 z-50",
                "hidden group-hover:block",
                "before:absolute before:-top-2 before:left-0 before:right-0 before:h-4"
              )}
            >
              <div className="min-w-[210px] w-max max-w-[290px] p-4 flex flex-col bg-card rounded-lg border border-border/80 shadow-sm">
                {/* Tiêu đề danh mục cha */}
                <Link
                  href={`/articles?category=${category.slug}`}
                  className="font-bold text-base text-foreground hover:text-primary mb-3 block"
                >
                  {category.name}
                </Link>

                {/* Danh sách danh mục con */}
                <div className="flex flex-col gap-2">
                  {category.children.map((child) => {
                    const isChildActive = currentCategory === child.slug;
                    return (
                      <Link
                        key={child._id}
                        href={`/articles?category=${child.slug}`}
                        className={cn(
                          "text-sm block leading-relaxed",
                          isChildActive
                            ? "text-primary font-medium"
                            : "text-foreground/80 hover:text-primary"
                        )}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DesktopNav(props: DesktopNavProps) {
  return (
    <Suspense fallback={<div className="flex items-center gap-2 sm:gap-4 flex-wrap" />}>
      <DesktopNavContent {...props} />
    </Suspense>
  );
}
