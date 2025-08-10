// src/app/layout.tsx

import type { Metadata } from "next";
import { Poppins as FontSans, Alegreya as FontSerif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

const fontSans = FontSans({
  subsets: ["latin", "vietnamese"], // Added vietnamese subset
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const fontSerif = FontSerif({
  subsets: ["latin", "vietnamese"], // Added vietnamese subset
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Văn Chương Mạn Đàm",
  description: "Một không gian cho những thảo luận và phân tích văn học sâu sắc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased", // Changed to font-sans
          fontSans.variable,
          fontSerif.variable
        )}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
