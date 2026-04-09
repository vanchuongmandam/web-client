"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getAccessRequestsPaginated, reviewAccessRequest, type AccessRequest } from "@/lib/api";
import type { PaginationMeta } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCheck, MessageSquareQuote, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function RequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { token } = useAuth();

  const fetchRequests = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = { page: currentPage, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      const result = await getAccessRequestsPaginated(token, params);
      setRequests(result.data);
      setPagination(result.pagination);
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải danh sách yêu cầu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, statusFilter, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    if (!token) return;
    try {
      await reviewAccessRequest(id, newStatus, token);
      toast({ title: "Thành công", description: `Đã cập nhật trạng thái thành ${newStatus}` });
      fetchRequests();
    } catch {
      toast({ title: "Lỗi", description: "Có lỗi khi cập nhật trạng thái.", variant: "destructive" });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  if (!token && !loading) return <div className="p-8 text-center">Vui lòng đăng nhập quyền admin.</div>;

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="rounded-xl border bg-card p-5">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <MessageSquareQuote />
          Quản lý yêu cầu truy cập
        </h1>
        <p className="text-sm text-muted-foreground">
          Duyệt yêu cầu truy cập tài liệu bị giới hạn và theo dõi tình trạng xử lý.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chờ duyệt</CardDescription>
            <CardTitle className="text-2xl">{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã duyệt</CardDescription>
            <CardTitle className="text-2xl">{approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Từ chối</CardDescription>
            <CardTitle className="text-2xl">{rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách yêu cầu</CardTitle>
          <CardDescription>Lọc theo trạng thái và xử lý trực tiếp trong bảng.</CardDescription>
          <Separator />
          <Select onValueChange={handleStatusFilterChange} value={statusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Bài viết</TableHead>
                  <TableHead className="w-[320px]">Lý do</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Không có yêu cầu nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">{request.user?.username || "Unknown"}</TableCell>
                      <TableCell>
                        <a
                          href={`/articles/${request.article?.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {request.article?.title || "Unknown Article"}
                        </a>
                      </TableCell>
                      <TableCell className="break-words">{request.reason}</TableCell>
                      <TableCell>{format(new Date(request.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "approved"
                              ? "default"
                              : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {request.status === "approved"
                            ? "Đã duyệt"
                            : request.status === "rejected"
                              ? "Từ chối"
                              : "Chờ duyệt"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(request._id, "approved")}
                            >
                              <CheckCheck data-icon="inline-start" />
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(request._id, "rejected")}
                            >
                              <XCircle data-icon="inline-start" />
                              Từ chối
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Đã xử lý</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {pagination && (
        <PaginationControls
          pagination={pagination}
          onPageChange={handlePageChange}
          isLoading={loading}
        />
      )}
    </div>
  );
}
