import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Literary Lantern',
  description: 'A sanctuary for literary exploration and discovery.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,700;1,7..72,400;1,7..72,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "min-h-screen font-body bg-background text-foreground antialiased"
      )}>
        <div className="relative flex min-h-dvh flex-col">
          <Header />
          <main className="flex-1 animate-fade-in">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
