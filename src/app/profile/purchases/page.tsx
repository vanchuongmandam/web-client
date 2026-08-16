// src/app/profile/purchases/page.tsx
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

const getBookCoverTheme = (docId: string) => {
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  const themes = [
    { bg: 'bg-[#5c3e35]', text: 'text-[#f4eae1]', border: 'border-[#432d27]', tagBg: 'bg-[#432d27]/40 text-[#f4eae1]/90', lineBg: 'bg-[#a37055]' }, // Warm Mahogany
    { bg: 'bg-[#2b3a32]', text: 'text-[#e9f1e8]', border: 'border-[#1d2722]', tagBg: 'bg-[#1d2722]/40 text-[#e9f1e8]/90', lineBg: 'bg-[#526f5c]' }, // Forest Moss
    { bg: 'bg-[#3b2b3a]', text: 'text-[#f5eaf4]', border: 'border-[#261c25]', tagBg: 'bg-[#261c25]/40 text-[#f5eaf4]/90', lineBg: 'bg-[#7a5879]' }, // Dark Aubergine
    { bg: 'bg-[#1f2d3d]', text: 'text-[#e9f1f6]', border: 'border-[#131b25]', tagBg: 'bg-[#131b25]/40 text-[#e9f1f6]/90', lineBg: 'bg-[#4f6b8c]' }, // Slate Ocean
    { bg: 'bg-[#e2d6c5]', text: 'text-[#3e342a]', border: 'border-[#ccbfae]', tagBg: 'bg-[#3e342a]/15 text-[#3e342a]/95', lineBg: 'bg-[#bca68d]' }, // Vintage Parchment
  ];
  return themes[sum % themes.length];
};

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
      .catch(() =>
        toast({ title: "Lỗi", description: "Không thể tải danh sách", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, [authLoading, token, router, page, toast]);

  const handleDownload = async (documentId: string) => {
    if (!token) return;
    try {
      const info = await getDocumentDownload(documentId, token);
      window.open(info.downloadUrl, "_blank");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tải tài liệu",
        variant: "destructive",
      });
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
        token
      );

      setPurchases((prev) =>
        prev.map((purchase) =>
          purchase._id === editingPurchaseId
            ? {
                ...purchase,
                rating: updated.rating,
                review: updated.review,
              }
            : purchase
        )
      );

      toast({ title: "Đã lưu đánh giá", description: "Cảm ơn bạn đã chia sẻ nhận xét." });
      setEditingPurchaseId(null);
      setReviewDraft("");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể gửi đánh giá",
        variant: "destructive",
      });
    } finally {
      setSavingReview(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
        <BookOpen className="h-5 w-5 text-primary" /> Thư viện tài liệu đã mua
      </h2>

      {purchases.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl bg-muted/10 min-h-[300px] flex flex-col justify-center items-center">
          <FileText className="mx-auto mb-3 h-14 w-14 text-primary opacity-25" />
          <h3 className="text-sm font-bold text-foreground">Thư viện trống</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4 leading-relaxed">
            Các tài liệu đã mua sẽ xuất hiện tại đây để tải về hoặc ghi nhận xét bất cứ lúc nào.
          </p>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            onClick={() => router.push("/documents")}
          >
            Khám phá tài liệu ngay
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase._id} className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-4">
                
                {/* Main row layout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left part: Cover + Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    
                    {/* Cover image (compact size) */}
                    <div className="relative w-14 aspect-[1/1.38] shrink-0 overflow-hidden rounded shadow-[2px_2px_5px_rgba(0,0,0,0.12)] border border-[#2d2d2d]/10 bg-card">
                      {purchase.document.coverImage || purchase.document.previewImages?.[0] ? (
                        <img src={purchase.document.coverImage || purchase.document.previewImages[0]} alt={purchase.document.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${getBookCoverTheme(purchase.document._id).bg} ${getBookCoverTheme(purchase.document._id).text} flex flex-col p-1.5 justify-between relative`}>
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10"></div>
                          <span className="text-[5px] uppercase tracking-wider font-semibold opacity-75 truncate max-w-full text-center">
                            {purchase.document.category?.name || 'TÀI LIỆU'}
                          </span>
                          <p className="font-bold text-[6px] leading-tight line-clamp-3 text-center my-auto px-0.5">
                            {purchase.document.title}
                          </p>
                          <span className="text-[5px] opacity-75 font-sans pt-0.5 border-t border-current/10 text-center">
                            {purchase.document.fileFormat?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/documents/${purchase.document.slug}`}
                        className="font-bold text-foreground hover:text-primary text-sm sm:text-base leading-snug line-clamp-2"
                      >
                        {purchase.document.title}
                      </Link>
                      <p className="text-xs text-muted-foreground italic mt-0.5">Tác giả: {purchase.document.author || 'Khuyết danh'}</p>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <Badge variant="outline" className="text-stone-600 bg-stone-100 border-border font-bold text-[9px] px-1.5 py-0">
                          {purchase.document.fileFormat?.toUpperCase()}
                        </Badge>
                        <span>Đã tải: <strong className="text-stone-700 font-mono">{purchase.downloadCount}</strong> lần</span>
                        {purchase.rating && (
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {purchase.rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right part: Actions */}
                  <div className="flex items-center gap-2 shrink-0 sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border border-border hover:bg-accent text-primary font-bold text-xs h-9"
                      onClick={() => startEditReview(purchase)}
                    >
                      <MessageSquare className="mr-1 h-3.5 w-3.5" />
                      {purchase.rating ? "Sửa nhận xét" : "Viết nhận xét"}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 shadow-sm"
                      onClick={() => handleDownload(purchase.document._id)}
                    >
                      <Download className="mr-1 h-3.5 w-3.5" /> Tải về máy
                    </Button>
                  </div>
                </div>

                {/* Collapsible Review Display */}
                {purchase.review && editingPurchaseId !== purchase._id && (
                  <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs sm:text-sm text-stone-700 animate-fade-in">
                    <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Nhận xét của bạn</p>
                    <p className="text-stone-700 italic leading-relaxed">&ldquo;{purchase.review}&rdquo;</p>
                  </div>
                )}

                {/* Collapsible Edit Review form */}
                {editingPurchaseId === purchase._id && (
                  <div className="space-y-3.5 rounded-lg border border-dashed border-border p-4 bg-muted/50 animate-fade-in">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Đánh giá và cảm nhận tài liệu</p>
                    
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          aria-label={`Chọn ${score} sao`}
                          onClick={() => setRatingDraft(score)}
                          className="rounded p-1 hover:bg-accent transition-colors"
                        >
                          <Star
                            className={`h-6 w-6 transition-all ${
                              score <= ratingDraft
                                ? "fill-amber-500 text-amber-500 scale-105"
                                : "text-stone-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    
                    <Textarea
                      rows={3}
                      maxLength={1000}
                      value={reviewDraft}
                      onChange={(e) => setReviewDraft(e.target.value)}
                      placeholder="Chia sẻ cảm nhận của bạn về tài liệu này để giúp đỡ người mua khác..."
                      className="bg-transparent border border-border text-foreground focus-visible:ring-ring text-xs sm:text-sm"
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSubmitReview}
                        disabled={savingReview}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"
                      >
                        {savingReview ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                        Lưu nhận xét
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border border-border bg-transparent text-muted-foreground font-bold text-xs hover:bg-accent"
                        onClick={() => {
                          setEditingPurchaseId(null);
                          setReviewDraft("");
                        }}
                      >
                        Hủy bỏ
                      </Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="border border-border bg-card text-primary font-bold hover:bg-accent text-xs rounded"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </Button>
              <span className="flex items-center text-xs text-muted-foreground px-3 font-semibold">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border border-border bg-card text-primary font-bold hover:bg-accent text-xs rounded"
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
