import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "./ui/button";

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16.29 4.11a4.84 4.84 0 0 1-2.82.62 4.84 4.84 0 0 1-4.14-4.14V0H5.5v12.3a5.5 5.5 0 0 0 5.5 5.5h.19a5.5 5.5 0 0 0 5.31-4.32 5.37 5.37 0 0 0 .19-1.38V7.47h-3.75v3.42a1.74 1.74 0 0 1-1.75 1.75 1.74 1.74 0 0 1-1.75-1.75V4.73a4.84 4.84 0 0 1 2.82-.62 4.84 4.84 0 0 1 4.14 4.14"/>
    </svg>
)

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
)

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block font-headline text-lg">
            Văn Chương Mạn Đàm
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/articles" className="transition-colors hover:text-foreground/80 text-foreground/60 font-headline">
            Bài viết
          </Link>
          <Link href="/library" className="transition-colors hover:text-foreground/80 text-foreground/60 font-headline">
            Thư viện
          </Link>
          <Link href="/contact" className="transition-colors hover:text-foreground/80 text-foreground/60 font-headline">
            Liên hệ
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <a href="https://www.facebook.com/vanchuongmandam" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <FacebookIcon className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Button>
            </a>
            <a href="https://www.tiktok.com/@tanka.vn" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <TikTokIcon className="h-5 w-5" />
                <span className="sr-only">TikTok</span>
              </Button>
            </a>
            <Link href="/premium">
              <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90 hidden sm:flex">
                Nâng cấp Premium
              </Button>
            </Link>
             <Link href="/login">
              <Button variant="outline">
                Đăng nhập
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
