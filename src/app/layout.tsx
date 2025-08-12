// src/app/layout.tsx

import type { Metadata } from "next";
// Import 'localFont' to use self-hosted fonts
import localFont from "next/font/local"; 
import { Alegreya as FontSerif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

// Configure the local Poppins font
const fontSans = localFont({
  src: [
    {
      path: '../assets/fonts/Poppins-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Poppins-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../assets/fonts/Poppins-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Poppins-MediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../assets/fonts/Poppins-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
     {
      path: '../assets/fonts/Poppins-SemiBoldItalic.ttf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../assets/fonts/Poppins-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Poppins-BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: "--font-sans",
  display: 'swap', // Improves font loading performance
});


const fontSerif = FontSerif({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Văn Chương Mạn Đàm",
  description: "Fanpage được sáng lập bởi đội ngũ Admin giàu kinh nghiệm Trường THPT Chuyên Hà Tĩnh - GV Ngữ văn và Cựu HSGQG môn Văn. Ở đây có: tiếng nói TRI ÂM qua trang sách, CÂU CHUYỆN văn chương thú vị và KIẾN THỨC cần thiết cho tất cả các kì thi.",
  keywords: [
    "văn học",
    "văn chương",
    "phân tích văn học", 
    "thảo luận văn học",
    "tác phẩm văn học",
    "văn học Việt Nam",
    "văn học thế giới",
    "phê bình văn học",
    "cộng đồng văn học"
  ],
  authors: [{ name: "Văn Chương Mạn Đàm Team" }],
  creator: "Thái Thanh Huyền",
  publisher: "Văn Chương Mạn Đàm",
  category: "Literature",
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
          "min-h-screen bg-background font-sans antialiased",
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
