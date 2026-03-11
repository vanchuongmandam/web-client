"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getAccessRequestsPaginated, reviewAccessRequest, type AccessRequest } from "@/lib/api";
import type { PaginationMeta } from "@/lib/types";

export default function RequestsPage() {
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { token } = useAuth();

    const fetchRequests = useCallback(async () => {
        if (!token) { setLoading(false); return; }
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

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    if (!token && !loading) return <div className="p-8 text-center">Vui lòng đăng nhập quyền Admin.</div>;

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Quản lý Yêu cầu Xem Tài liệu</h1>
                <Select onValueChange={handleStatusFilterChange} value={statusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Lọc trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="pending">Chờ duyệt</SelectItem>
                        <SelectItem value="approved">Đã duyệt</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="p-8 text-center">Đang tải...</div>
            ) : (
                <>
                    <div className="bg-white rounded-md border shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Người dùng</TableHead>
                                    <TableHead>Bài viết</TableHead>
                                    <TableHead className="w-[300px]">Lý do / Trả lời câu hỏi</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            Không có yêu cầu nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((request) => (
                                        <TableRow key={request._id}>
                                            <TableCell className="font-medium">{request.user?.username || "Unknown"}</TableCell>
                                            <TableCell>
                                                <a href={`/articles/${request.article?.slug}`} target="_blank" className="hover:underline text-blue-600">
                                                    {request.article?.title || "Unknown Article"}
                                                </a>
                                            </TableCell>
                                            <TableCell className="break-words">{request.reason}</TableCell>
                                            <TableCell>{format(new Date(request.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    request.status === "approved" ? "default" :
                                                        request.status === "rejected" ? "destructive" : "secondary"
                                                }>
                                                    {request.status === "approved" ? "Đã duyệt" :
                                                        request.status === "rejected" ? "Từ chối" : "Chờ duyệt"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {request.status === "pending" && (
                                                    <>
                                                        <Button
                                                            size="sm" variant="outline"
                                                            className="text-green-600 border-green-600 hover:bg-green-50"
                                                            onClick={() => handleUpdateStatus(request._id, "approved")}
                                                        >
                                                            Duyệt
                                                        </Button>
                                                        <Button
                                                            size="sm" variant="outline"
                                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                                            onClick={() => handleUpdateStatus(request._id, "rejected")}
                                                        >
                                                            Từ chối
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {pagination && (
                        <PaginationControls
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            isLoading={loading}
                        />
                    )}
                </>
            )}
        </div>
    );
}
