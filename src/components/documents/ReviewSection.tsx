// src/components/documents/ReviewSection.tsx

"use client";

import { toErrorMessage } from "@/lib/errors";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getReviews, createReview, upvoteReview, checkDocumentOwnership } from "@/lib/api";
import type { Review } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, Loader2, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  documentId: string;
  price?: number;
  isFree?: boolean;
}

export default function ReviewSection({ documentId, price = 0, isFree = false }: Props) {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [owned, setOwned] = useState(false);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
    if (token) {
      checkDocumentOwnership(documentId, token)
        .then(res => setOwned(res.owned))
        .catch(() => { });
    }
  }, [documentId, token]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await getReviews(documentId, { limit: 10, sort: '-createdAt' });
      setReviews(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const newReview = await createReview(documentId, rating, content, token);
      setReviews(prev => [newReview, ...prev]);
      setContent("");
      setRating(5);
      toast({ title: "Đánh giá thành công!" });
    } catch (e) {
      toast({ title: "Lỗi đánh giá", description: toErrorMessage(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (reviewId: string) => {
    if (!token) {
      toast({ title: "Vui lòng đăng nhập để thích đánh giá." });
      return;
    }
    try {
      const updated = await upvoteReview(reviewId, token);
      setReviews(prev => prev.map(r => r._id === reviewId ? updated : r));
    } catch (e) {
      toast({ title: "Lỗi", description: toErrorMessage(e), variant: "destructive" });
    }
  };

  const canReview = isFree || price === 0 || owned;

  return (
    <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 rounded-xl overflow-hidden shadow-xs font-sans">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-[#483d31]">Đánh giá từ cộng đồng</CardTitle>
        <CardDescription className="text-xs text-[#7e7363]">Ý kiến, nhận xét học thuật và chia sẻ cảm nhận từ các độc giả.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Form Đánh giá */}
        {user ? (
          canReview ? (
            <Card className="bg-[#fcf9f2] border-2 border-[#ebdcb9] rounded-md shadow-none">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[#ebdcb9]">
                      <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-[#483d31]">{user.username}</p>
                      {owned ? (
                        <p className="text-[11px] text-[#3c6b41] font-semibold flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5" /> Đã sở hữu tài liệu
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#3c6b41] font-semibold flex items-center gap-1">
                          Tài liệu miễn phí
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                        <Star className={`w-5 h-5 ${star <= rating ? "fill-[#cbb685] text-[#cbb685]" : "text-muted-foreground/30"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  placeholder="Chia sẻ cảm nhận chân thực của bạn để giúp ích cho cộng đồng học tập..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="resize-none border-2 border-[#ebdcb9]/60 focus-visible:ring-primary/45 rounded-md bg-transparent text-sm"
                  rows={3}
                />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !content.trim()}
                    className="bg-[#4c6b54] text-[#f7eaf0] hover:bg-[#3b5341] font-bold h-9 text-xs rounded-md shadow-sm"
                  >
                    {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Gửi đánh giá
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-[#ebdcb9]/15 border-2 border-dashed border-[#ebdcb9] p-6 rounded-md text-center text-[#7e7363] text-xs">
              <p className="font-bold text-[#8e2929] mb-1">Quyền nhận xét được giới hạn</p>
              <p className="italic">Chỉ những thành viên đã sở hữu tài liệu này mới có thể viết nhận xét & đánh giá. Vui lòng mua/nhận tài liệu trước.</p>
            </div>
          )
        ) : (
          <div className="bg-[#ebdcb9]/10 p-6 rounded-md text-center border-2 border-dashed border-[#ebdcb9] text-xs text-[#7e7363]">
            <p>Vui lòng <Link href="/login" className="font-bold text-[#4c6b54] underline hover:text-[#3b5341]">đăng nhập</Link> để viết nhận xét & đánh giá tài liệu.</p>
          </div>
        )}

        {/* Danh sách Đánh giá */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary opacity-60 w-6 h-6" /></div>
          ) : reviews.length === 0 ? (
            <p className="text-center text-xs text-[#7e7363] py-8 italic bg-[#ebdcb9]/10 border border-dashed border-[#ebdcb9]/60 rounded-md">Chưa có đánh giá nào cho tài liệu này.</p>
          ) : (
            reviews.map((r) => (
              <Card key={r._id} className="border-2 border-[#ebdcb9]/60 bg-[#fcf9f2]/40 rounded-md overflow-hidden shadow-none">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-[#ebdcb9]">
                        <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${r.user?.username}`} />
                        <AvatarFallback>{r.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs text-[#483d31]">{r.user?.displayName || r.user?.username}</p>
                          {r.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[8px] uppercase font-bold text-[#3c6b41] bg-[#ebf4ef] px-1.5 py-0.5 rounded border border-[#d2e7dd]">
                              <BadgeCheck className="w-2.5 h-2.5" /> Đã mua
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-[#cbb685] text-[#cbb685]" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#5a5045] whitespace-pre-wrap leading-relaxed pl-12">{r.content}</p>
                  <div className="mt-3 flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2 gap-1 rounded-md text-[10px] ${r.upvotes?.includes(user?._id || '') ? "text-[#4c6b54] bg-[#4c6b54]/10 hover:bg-[#4c6b54]/20" : "text-muted-foreground hover:bg-[#ebdcb9]/15"}`}
                      onClick={() => handleUpvote(r._id)}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span className="font-semibold">{r.upvoteCount || 0} Hữu ích</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
