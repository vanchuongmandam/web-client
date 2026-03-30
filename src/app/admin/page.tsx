// src/app/admin/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePlus2, LayoutList, Tag, FileText, FilePlus, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">Trang Quản Trị</h1>
        <p className="text-muted-foreground mt-2">
          Chào mừng trở lại! Quản lý nội dung trang web của bạn tại đây.
        </p>
      </header>

      {/* Bài viết */}
      <h2 className="text-lg font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Bài viết</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="h-6 w-6" />
              Quản lý Bài viết
            </CardTitle>
            <CardDescription>Xem, chỉnh sửa hoặc xóa các bài viết đã đăng.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/articles">Đi tới quản lý</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePlus2 className="h-6 w-6" />
              Thêm bài viết mới
            </CardTitle>
            <CardDescription>Tạo một bài viết mới với trình soạn thảo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/articles/new">Tạo bài viết</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-6 w-6" />
              Quản lý Danh mục
            </CardTitle>
            <CardDescription>Thêm hoặc xóa các danh mục bài viết.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/categories">Quản lý danh mục</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace */}
      <h2 className="text-lg font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Marketplace</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Quản lý Tài liệu
            </CardTitle>
            <CardDescription>Xem, chỉnh sửa, bật/tắt và xóa tài liệu đang bán.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/documents">Đi tới quản lý</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePlus className="h-6 w-6" />
              Thêm tài liệu mới
            </CardTitle>
            <CardDescription>Tạo tài liệu mới để đưa lên marketplace bán.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/documents/new">Tạo tài liệu</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Quản lý Đơn hàng
            </CardTitle>
            <CardDescription>Xem tất cả đơn hàng, trạng thái thanh toán và doanh thu.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/orders">Xem đơn hàng</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
