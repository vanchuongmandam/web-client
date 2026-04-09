"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserPurchases, getDocumentDownload, addReview } from "@/lib/api";
import type { Purchase, PaginationMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, Star, BookOpen, MessageSquare } from "lucide-react";

export default function PurchasesPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [ratingDraft, setRatingDraft] = useState(5);
  const [reviewDraft, setReviewDraft] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    getUserPurchases({ page, limit: 10 }, token)
      .then((res) => {
        setPurchases(res.data);
        setPagination(res.pagination);
      })
      .catch(() => toast({ title: "Lỗi", description: "Không thể tải danh sách", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, token, router, page, toast]);

  const handleDownload = async (documentId: string) => {
    if (!token) return;
    try {
      const info = await getDocumentDownload(documentId, token);
      window.open(info.downloadUrl, "_blank");
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: err instanceof Error ? err.message : "Không thể tải", variant: "destructive" });
    }
  };

  const startEditReview = (purchase: Purchase) => {
    setEditingPurchaseId(purchase._id);
    setRatingDraft(purchase.rating || 5);
    setReviewDraft(purchase.review || "");
  };

  const handleSubmitReview = async () => {
    if (!token || !editingPurchaseId) return;

    setSavingReview(true);
    try {
      const updated = await addReview(
        editingPurchaseId,
        { rating: ratingDraft, review: reviewDraft.trim() || undefined },
        token,
      );

      setPurchases((prev) =>
        prev.map((purchase) =>
          purchase._id === editingPurchaseId
            ? {
                ...purchase,
                rating: updated.rating,
                review: updated.review,
              }
            : purchase,
        ),
      );

      toast({ title: "Đã lưu đánh giá", description: "Cảm ơn bạn đã chia sẻ nhận xét." });
      setEditingPurchaseId(null);
      setReviewDraft("");
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể gửi đánh giá",
        variant: "destructive",
      });
    } finally {
      setSavingReview(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold">
        <BookOpen className="h-8 w-8" /> Thư viện của tôi
      </h1>

      {purchases.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Chưa có tài liệu nào</h2>
          <p className="mt-2 text-muted-foreground">Hãy mua tài liệu đầu tiên từ kho tài liệu.</p>
          <Button className="mt-4" onClick={() => router.push("/documents")}>
            Khám phá tài liệu
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase._id}>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Link href={`/documents/${purchase.document.slug}`} className="font-semibold hover:underline">
                      {purchase.document.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{purchase.document.author}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{purchase.document.fileFormat?.toUpperCase()}</Badge>
                      <span>Đã tải {purchase.downloadCount} lần</span>
                      {purchase.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> {purchase.rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEditReview(purchase)}>
                      <MessageSquare className="mr-1 h-4 w-4" />
                      {purchase.rating ? "Sửa đánh giá" : "Đánh giá"}
                    </Button>
                    <Button size="sm" onClick={() => handleDownload(purchase.document._id)}>
                      <Download className="mr-1 h-4 w-4" /> Tải
                    </Button>
                  </div>
                </div>

                {purchase.review && editingPurchaseId !== purchase._id && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">Nhận xét của bạn</p>
                    <p className="mt-1 text-muted-foreground">{purchase.review}</p>
                  </div>
                )}

                {editingPurchaseId === purchase._id && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <p className="text-sm font-medium">Đánh giá tài liệu</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          aria-label={`Chọn ${score} sao`}
                          onClick={() => setRatingDraft(score)}
                          className="rounded p-1 hover:bg-muted"
                        >
                          <Star
                            className={`h-5 w-5 ${score <= ratingDraft ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      rows={3}
                      maxLength={1000}
                      value={reviewDraft}
                      onChange={(e) => setReviewDraft(e.target.value)}
                      placeholder="Chia sẻ cảm nhận của bạn về tài liệu này..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitReview} disabled={savingReview}>
                        {savingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Lưu đánh giá
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingPurchaseId(null);
                          setReviewDraft("");
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
