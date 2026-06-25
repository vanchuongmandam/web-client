"use client";

import {
  FilePlus,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LayoutList,
  MessageSquareQuote,
  ShoppingBag,
  Tag,
  Users,
  Ticket
} from "lucide-react";

import {
  Sidebar,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname } from "next/navigation";

const contentItems = [
  {
    title: "Tổng quan",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Danh sách bài viết",
    url: "/admin/articles",
    icon: LayoutList,
  },
  {
    title: "Thêm bài viết",
    url: "/admin/articles/new",
    icon: FilePlus2,
  },
  {
    title: "Danh mục",
    url: "/admin/categories",
    icon: Tag,
  },
];

const marketplaceItems = [
  {
    title: "Kho tài liệu",
    url: "/admin/documents",
    icon: FileText,
  },
  {
    title: "Thêm tài liệu",
    url: "/admin/documents/new",
    icon: FilePlus,
  },
  {
    title: "Đơn hàng",
    url: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Yêu cầu truy cập",
    url: "/admin/requests",
    icon: MessageSquareQuote,
  },
];

const systemItems = [
  {
    title: "Người dùng",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Mã giảm giá",
    url: "/admin/coupons",
    icon: Ticket,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isRouteActive = (url: string) => {
    if (url === "/admin") return pathname === "/admin";
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-bold text-xl text-primary transition-opacity hover:opacity-80"
        >
          <LayoutDashboard />
          <span>VCM Admin</span>
        </Link>
        <Badge variant="outline" className="mt-3 w-fit bg-primary/5 text-primary border-primary/10 text-[10px] font-medium py-0.5 px-2 rounded-md">
          Bảng điều khiển
        </Badge>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Nội dung</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isRouteActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Marketplace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {marketplaceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isRouteActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Hệ thống</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isRouteActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">Không gian quản trị Marketplace</p>
      </SidebarFooter>
    </Sidebar>
  );
}
