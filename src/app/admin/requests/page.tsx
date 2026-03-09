"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AccessRequest {
    _id: string;
    user: {
        _id: string;
        username: string;
    };
    article: {
        _id: string;
        title: string;
        slug: string;
    };
    status: "pending" | "approved" | "rejected";
    reason: string;
    createdAt: string;
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    // Note: In a real app, you'd get the token from a context/hook
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Basic implementation to get token from localStorage if available
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);
        if (storedToken) {
            fetchRequests(storedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchRequests = async (authToken: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/requests`, {
                headers: {
                    "Authorization": `Bearer ${authToken}`
                }
            });
            if (!res.ok) throw new Error("Không thể tải danh sách yêu cầu");
            const data = await res.json();
            setRequests(data.data ?? data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Lỗi loading",
                description: "Không thể tải danh sách yêu cầu.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected") => {
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/requests/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error("Cập nhật thất bại");

            toast({
                title: "Thành công",
                description: `Đã cập nhật trạng thái thành ${newStatus}`,
            });

            // Refresh list locally
            setRequests(prev => prev.map(req =>
                req._id === id ? { ...req, status: newStatus } : req
            ));
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Có lỗi khi cập nhật trạng thái.",
                variant: "destructive"
            });
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!token) return <div className="p-8 text-center">Vui lòng đăng nhập quyền Admin.</div>;

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Quản lý Yêu cầu Xem Tài liệu</h1>
            <div className="bg-white rounded-md border shadow-sm mt-4">
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
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                                    onClick={() => handleUpdateStatus(request._id, "approved")}
                                                >
                                                    Duyệt
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
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
        </div>
    );
}
