import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/api";
import type { Category } from "@/lib/types";
import { AuthControls } from "@/components/auth-controls";
import Logo from "@/assets/logo/vanchuongmandam-logo.svg";
import LogoText from "@/assets/logo/vanchuongmandam-chu.svg";
import BannerImage from "@/assets/logo/banner.webp";
import { SearchButtonAndOverlay } from "@/components/search-button-and-overlay";
import { DesktopNav } from "@/components/desktop-nav";
import { MobileNav } from "@/components/mobile-nav";
import { BookOpen } from "lucide-react";

export async function Header() {
  const parentCategories: Category[] = await getCategories().catch(() => []);

  return (
    <>
      <div
        className="relative overflow-hidden border-b border-border/60"
        style={{
          backgroundImage: `url(${BannerImage.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-card/60 backdrop-blur-xs z-0" />
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between relative z-10">
          <Link href="/" className="inline-flex flex-col group">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image
                src={Logo}
                alt="vanchuongmandam"
                height={120}
                className="h-11 sm:h-14 md:h-20 lg:h-24 w-auto transition-transform duration-200 group-hover:scale-102"
                priority
              />
              <div className="relative">
                <Image
                  src={LogoText}
                  alt="vanchuongmandam"
                  height={150}
                  className="h-12 sm:h-18 md:h-24 lg:h-28 w-auto"
                  priority
                />

                <p className="hidden md:block absolute bottom-4 left-full ml-2.5 text-xs italic text-muted-foreground whitespace-nowrap">
                  Think deeper, feel kinder, read wider.
                </p>

                <p className="hidden md:block absolute bottom-0.5 left-full ml-2.5 text-xs italic text-muted-foreground whitespace-nowrap">
                  Suy nghĩ sâu hơn, cảm nhân ái hơn, đọc rộng hơn.
                </p>
              </div>
            </div>
            <div className="md:hidden text-xs italic text-muted-foreground mt-2 text-center">
              <p>Think deeper, feel kinder, read wider.</p>
              <p>Suy nghĩ sâu hơn, cảm nhân ái hơn, đọc rộng hơn.</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Auth Controls */}
            <div className="hidden sm:flex items-center">
              <AuthControls />
            </div>

            {/* Mobile Search & Menu */}
            <div className="flex md:hidden items-center gap-1.5">
              <SearchButtonAndOverlay />
              <MobileNav parentCategories={parentCategories} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Sticky */}
      <nav className="bg-card/90 backdrop-blur-md sticky top-0 z-40 border-b border-border/60">
        <div className="container mx-auto px-4 hidden md:flex items-center justify-between h-14">
          {/* Left & Center: Desktop Navigation Menu with hover subcategories */}
          <div className="flex items-center flex-1 min-w-0 mr-4">
            <DesktopNav parentCategories={parentCategories} />
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/documents">
              <Button
                variant="accent"
                size="sm"
                className="border-primary/30 hover:border-primary/80 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-xs h-9 px-3.5 rounded-md flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>Kho tài liệu</span>
              </Button>
            </Link>
            <SearchButtonAndOverlay />
          </div>
        </div>
      </nav>
    </>
  );
}
