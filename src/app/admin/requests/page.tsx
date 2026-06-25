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
import { CheckCheck, MessageSquareQuote, XCircle, Clock, Check, X, FileQuestion } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

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
      const params: { page: number; limit: number; status?: string } = { page: currentPage, limit: 15 };
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
      toast({ title: "Thành công", description: `Đã cập nhật trạng thái thành ${newStatus === "approved" ? "chấp nhận" : "từ chối"}.` });
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

  if (!token && !loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2">
        <p className="text-sm font-semibold text-muted-foreground">Vui lòng đăng nhập tài khoản Admin để truy cập trang này.</p>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquareQuote className="h-6 w-6 text-primary" /> Yêu cầu Truy cập
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xét duyệt quyền xem các tài liệu/bài viết bị giới hạn.
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border border-border/60 shadow-sm rounded-xl">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chờ duyệt</CardDescription>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <CardTitle className="text-2xl font-bold tracking-tight text-amber-600">{loading ? <Skeleton className="h-8 w-12" /> : pendingCount}</CardTitle>
          </CardContent>
        </Card>
        
        <Card className="border border-border/60 shadow-sm rounded-xl">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Đã duyệt</CardDescription>
            <Check className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <CardTitle className="text-2xl font-bold tracking-tight text-emerald-600">{loading ? <Skeleton className="h-8 w-12" /> : approvedCount}</CardTitle>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm rounded-xl">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Từ chối</CardDescription>
            <X className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <CardTitle className="text-2xl font-bold tracking-tight text-rose-600">{loading ? <Skeleton className="h-8 w-12" /> : rejectedCount}</CardTitle>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="py-4 border-b border-border/40 bg-zinc-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Danh sách yêu cầu</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">Duyệt hoặc từ chối các yêu cầu quyền truy cập.</CardDescription>
            </div>
            <Select onValueChange={handleStatusFilterChange} value={statusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9 text-xs bg-white border-zinc-200 rounded-lg">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs" value="all">Tất cả yêu cầu</SelectItem>
                <SelectItem className="text-xs" value="pending">Chờ duyệt</SelectItem>
                <SelectItem className="text-xs" value="approved">Đã duyệt</SelectItem>
                <SelectItem className="text-xs" value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Người dùng</TableHead>
                <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Bài viết / Tài liệu</TableHead>
                <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground max-w-[280px]">Lý do xin truy cập</TableHead>
                <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Ngày yêu cầu</TableHead>
                <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="text-right text-xs font-semibold py-2.5 text-muted-foreground pr-4">Xử lý</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-3.5"><Skeleton className="h-5 w-full rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground font-semibold text-sm">
                    <div className="flex flex-col items-center gap-2 py-4">
                      <FileQuestion className="h-6 w-6 text-muted-foreground/60" />
                      <p className="text-xs">Không tìm thấy yêu cầu nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request._id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                    <TableCell className="py-2.5 font-bold text-foreground text-xs">{request.user?.username || "Ẩn danh"}</TableCell>
                    <TableCell className="py-2.5 text-xs">
                      {request.article?.slug ? (
                        <Link
                          href={`/articles/${request.article.slug}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {request.article.title || "Tài liệu không xác định"}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground font-medium">{request.article?.title || "Không có tiêu đề"}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground font-medium max-w-[280px] break-words">
                      {request.reason || "Không cung cấp lý do"}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground font-semibold">
                      {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="py-2.5">
                      {request.status === "approved" ? (
                        <Badge className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border-emerald-200/40 text-emerald-700 hover:bg-emerald-500/10">
                          Đã duyệt
                        </Badge>
                      ) : request.status === "rejected" ? (
                        <Badge className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 border-rose-200/40 text-rose-700 hover:bg-rose-500/10">
                          Từ chối
                        </Badge>
                      ) : (
                        <Badge className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border-amber-200/40 text-amber-700 hover:bg-amber-500/10">
                          Chờ duyệt
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 pr-4 text-right">
                      {request.status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1 shadow-sm"
                            onClick={() => handleUpdateStatus(request._id, "approved")}
                          >
                            <CheckCheck className="h-3 w-3" /> Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-[10px] font-semibold text-rose-600 border-zinc-200 hover:bg-rose-50 hover:text-rose-700 rounded-md flex items-center gap-1"
                            onClick={() => handleUpdateStatus(request._id, "rejected")}
                          >
                            <XCircle className="h-3 w-3" /> Từ chối
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-semibold px-2 py-1 bg-zinc-50 border rounded-md">Đã xử lý</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {pagination && pagination.totalPages > 1 && (
        <div className="pt-2">
          <PaginationControls
            pagination={pagination}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
}
