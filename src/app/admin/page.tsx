// src/app/admin/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  ArrowRight,
  FilePlus,
  FilePlus2,
  FileText,
  LayoutList,
  MessageSquareQuote,
  ShoppingBag,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { OverviewDashboard } from "@/components/admin/overview-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const contentActions = [
    {
      title: "Quản lý bài viết",
      desc: "Xem, chỉnh sửa hoặc xóa bài viết đã đăng.",
      href: "/admin/articles",
      cta: "Đi tới quản lý",
      icon: LayoutList,
    },
    {
      title: "Thêm bài viết mới",
      desc: "Tạo bài viết mới với trình soạn thảo hiện tại.",
      href: "/admin/articles/new",
      cta: "Tạo bài viết",
      icon: FilePlus2,
    },
    {
      title: "Quản lý danh mục",
      desc: "Tổ chức cây danh mục và cập nhật nhanh.",
      href: "/admin/categories",
      cta: "Quản lý danh mục",
      icon: Tag,
    },
  ];

  const marketplaceActions = [
    {
      title: "Kho tài liệu",
      desc: "Quản lý tài liệu đang bán, trạng thái và nội dung.",
      href: "/admin/documents",
      cta: "Đi tới kho tài liệu",
      icon: FileText,
    },
    {
      title: "Thêm tài liệu mới",
      desc: "Tạo tài liệu mới cho marketplace.",
      href: "/admin/documents/new",
      cta: "Tạo tài liệu",
      icon: FilePlus,
    },
    {
      title: "Đơn hàng",
      desc: "Theo dõi thanh toán, trạng thái và doanh thu.",
      href: "/admin/orders",
      cta: "Xem đơn hàng",
      icon: ShoppingBag,
    },
    {
      title: "Yêu cầu truy cập",
      desc: "Duyệt các yêu cầu truy cập tài liệu hạn chế.",
      href: "/admin/requests",
      cta: "Xử lý yêu cầu",
      icon: MessageSquareQuote,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-8 rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Admin dashboard</Badge>
          <Badge variant="outline">Marketplace</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Trang quản trị</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Khu vực điều phối nội dung và marketplace. Chọn nhanh tác vụ bên dưới để thao tác theo từng
          nhóm.
        </p>
      </header>

      <OverviewDashboard />

      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">Nội dung</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {contentActions.map((item) => (
              <Card key={item.title} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <item.icon />
                    {item.title}
                  </CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
                <CardContent />
                <CardFooter>
                  <Button asChild className="w-full justify-between">
                    <Link href={item.href}>
                      {item.cta}
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {marketplaceActions.map((item) => (
              <Card key={item.title} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <item.icon />
                    {item.title}
                  </CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
                <CardContent />
                <CardFooter>
                  <Button asChild className="w-full justify-between">
                    <Link href={item.href}>
                      {item.cta}
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
