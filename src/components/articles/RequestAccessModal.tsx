"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RequestAccessModalProps {
    articleId: string;
    articleTitle: string;
    token?: string | null;
    onSuccess?: () => void;
}

export function RequestAccessModal({ articleId, articleTitle, token, onSuccess }: RequestAccessModalProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập lý do hoặc trả lời câu hỏi.",
                variant: "destructive",
            });
            return;
        }

        if (!token) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Bạn cần đăng nhập để gửi yêu cầu.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/requests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ articleId, reason }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Có lỗi xảy ra");
            }

            toast({
                title: "Thành công",
                description: data.message,
            });
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error: unknown) {
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Đã có lỗi không xác định xảy ra",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                    Yêu cầu quyền truy cập
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yêu cầu xem tài liệu</DialogTitle>
                    <DialogDescription>
                        Tài liệu này bị hạn chế. Vui lòng trả lời câu hỏi dưới đây để gửi yêu cầu truy cập.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="reason">Câu hỏi: Tại sao bạn muốn xem tài liệu này?</Label>
                        <Textarea
                            id="reason"
                            placeholder="Nhập câu trả lời của bạn..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="resize-none"
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Hủy
                    </Button>
                    <Button type="submit" onClick={handleSubmit} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                        {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
