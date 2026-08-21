// src/app/profile/purchases/page.tsx

"use client";

import { toErrorMessage } from "@/lib/errors";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { getUserPurchases, getDocumentDownload, addReview } from "@/lib/api";
import type { Purchase, PaginationMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Download,
  FileText,
  Star,
  BookOpen,
  MessageSquare,
  Search,
  X,
  LayoutGrid,
  List,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  FilterX,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Ban,
  Lock
} from "lucide-react";

// Helper to determine book cover theme dynamically (identical to document details)
const getBookCoverTheme = (docId: string) => {
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  const themes = [
    { bg: 'bg-category-brown', text: 'text-pastel-warm', border: 'border-category-red-dark', tagBg: 'bg-category-red-dark/40 text-pastel-warm/90', lineBg: 'bg-category-copper' },
    { bg: 'bg-forest-deepest', text: 'text-pastel-green', border: 'border-forest-night', tagBg: 'bg-forest-night/40 text-pastel-green/90', lineBg: 'bg-forest' },
    { bg: 'bg-category-purple-dark', text: 'text-pastel-purple', border: 'border-category-purple-night', tagBg: 'bg-category-purple-night/40 text-pastel-purple/90', lineBg: 'bg-category-purple' },
    { bg: 'bg-category-blue-dark', text: 'text-pastel-blue', border: 'border-category-blue-night', tagBg: 'bg-category-blue-night/40 text-pastel-blue/90', lineBg: 'bg-category-blue' },
    { bg: 'bg-warm-sand', text: 'text-earth-dark', border: 'border-sand-dark', tagBg: 'bg-earth-dark/15 text-earth-dark/95', lineBg: 'bg-sand-muted' },
  ];
  return themes[sum % themes.length];
};

export default function PurchasesPage() {
  const { token, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Search & Filter & View state
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Review Dialog State
  const [reviewDialogTarget, setReviewDialogTarget] = useState<Purchase | null>(null);
  const [ratingDraft, setRatingDraft] = useState(5);
  const [reviewDraft, setReviewDraft] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // Load view mode preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedView = localStorage.getItem("vcmd_purchases_view_mode");
      if (savedView === "list" || savedView === "grid") {
        setViewMode(savedView);
      }
    }
  }, []);

  const handleToggleViewMode = (mode: "list" | "grid") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("vcmd_purchases_view_mode", mode);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    getUserPurchases({ page, limit: 50 }, token)
      .then((res) => {
        setPurchases(res.data);
        setPagination(res.pagination);
      })
      .catch(() =>
        toast({ title: "Lỗi", description: "Không thể tải danh sách tài liệu", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, [authLoading, token, router, page, toast]);

  const handleDownload = async (documentId: string) => {
    if (!token) return;
    setDownloadingId(documentId);
    try {
      const info = await getDocumentDownload(documentId, token);
      window.open(info.downloadUrl, "_blank");
      // Optimistically increment local download count
      setPurchases(prev => prev.map(p =>
        p.document._id === documentId
          ? { ...p, downloadCount: (p.downloadCount || 0) + 1 }
          : p
      ));
    } catch (err) {
      toast({
        title: "Lỗi",
        description: toErrorMessage(err, "Không thể tải tài liệu"),
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const openReviewModal = (purchase: Purchase) => {
    setReviewDialogTarget(purchase);
    setRatingDraft(purchase.rating || 5);
    setReviewDraft(purchase.review || "");
  };

  const handleSubmitReview = async () => {
    if (!token || !reviewDialogTarget) return;

    setSavingReview(true);
    try {
      const updated = await addReview(
        reviewDialogTarget._id,
        { rating: ratingDraft, review: reviewDraft.trim() || undefined },
        token
      );

      setPurchases((prev) =>
        prev.map((p) =>
          p._id === reviewDialogTarget._id
            ? {
              ...p,
              rating: updated.rating,
              review: updated.review,
            }
            : p
        )
      );

      toast({ title: "Đã lưu đánh giá", description: "Cảm ơn bạn đã chia sẻ nhận xét về tác phẩm." });
      setReviewDialogTarget(null);
      setReviewDraft("");
    } catch (err) {
      toast({
        title: "Lỗi",
        description: toErrorMessage(err, "Không thể gửi đánh giá"),
        variant: "destructive",
      });
    } finally {
      setSavingReview(false);
    }
  };

  // Filter & Sort computation
  const filteredPurchases = useMemo(() => {
    let result = [...purchases];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.document.title?.toLowerCase().includes(q) ||
          p.document.author?.toLowerCase().includes(q) ||
          p.document.category?.name?.toLowerCase().includes(q)
      );
    }

    // Format filter
    if (formatFilter !== "all") {
      result = result.filter(
        (p) => p.document.fileFormat?.toLowerCase() === formatFilter.toLowerCase()
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "title_asc") {
        return (a.document.title || "").localeCompare(b.document.title || "", "vi");
      }
      if (sortBy === "title_desc") {
        return (b.document.title || "").localeCompare(a.document.title || "", "vi");
      }
      if (sortBy === "downloads") {
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      }
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

    return result;
  }, [purchases, searchQuery, formatFilter, sortBy]);

  const totalDownloads = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (p.downloadCount || 0), 0);
  }, [purchases]);

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6 font-sans">

        {/* 1. Header & Stats Strip */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-sand-light pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-earth flex items-center gap-2.5">
              <BookOpen className="size-6 text-forest shrink-0" />
              <span>Thư viện tài liệu đã sở hữu</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Không gian lưu trữ bản quyền số, đọc online tức thì và tải file gốc của bạn.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="border-sand bg-warm-cream text-earth-muted font-medium text-xs px-2.5 py-1 rounded-sm gap-1.5">
              <ShoppingBag className="size-3.5 text-forest" />
              <span>Đã sở hữu: <strong className="text-earth font-semibold">{purchases.length}</strong></span>
            </Badge>
            <Badge variant="outline" className="border-sand bg-warm-cream text-earth-muted font-medium text-xs px-2.5 py-1 rounded-sm gap-1.5">
              <Download className="size-3.5 text-forest" />
              <span>Đã tải: <strong className="text-earth font-semibold">{totalDownloads}</strong> lượt</span>
            </Badge>
          </div>
        </div>

        {purchases.length === 0 ? (
          /* Empty Collection State */
          <Card className="border-2 border-dashed border-sand bg-warm-cream/50 rounded-xl">
            <CardContent className="py-16 text-center flex flex-col justify-center items-center">
              <div className="size-16 rounded-full bg-sand/30 flex items-center justify-center mb-4 text-forest">
                <BookOpen className="size-8" />
              </div>
              <h3 className="text-base font-bold text-earth">Thư viện của bạn đang trống</h3>
              <p className="text-xs text-earth-muted max-w-sm mt-1.5 mb-5 leading-relaxed">
                Bạn chưa mua hoặc nhận tài liệu nào. Hãy khám phá kho tàng tư liệu học thuật và văn học được chọn lọc ngay nhé!
              </p>
              <Button
                className="bg-forest hover:bg-forest-dark text-white font-semibold text-xs px-5 h-9 rounded-md shadow-xs transition-all gap-2"
                onClick={() => router.push("/documents")}
              >
                <Sparkles className="size-3.5" />
                <span>Khám phá Tủ sách Tài liệu</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 2. Control Bar (Search, Filter, Sort & View Toggle) */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-warm-cream/70 border border-sand-light p-3 rounded-lg shadow-xs">

              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-earth-lighter" />
                <Input
                  type="text"
                  placeholder="Tìm theo tên tác phẩm, tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs bg-warm-ivory/60 border-sand hover:border-primary/45 rounded-md"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-earth p-0.5 rounded-full"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Filter & Sort & View Buttons */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

                {/* Format Filter */}
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="w-[125px] h-9 text-xs bg-warm-ivory/60 border-sand rounded-md text-earth-muted">
                    <SelectValue placeholder="Định dạng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Mọi định dạng</SelectItem>
                    <SelectItem value="pdf">Tệp PDF</SelectItem>
                    <SelectItem value="docx">Tệp DOCX</SelectItem>
                    <SelectItem value="zip">Tệp ZIP</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Selector */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[155px] h-9 text-xs bg-warm-ivory/60 border-sand rounded-md text-earth-muted">
                    <ArrowUpDown className="size-3.5 mr-1.5 text-forest" />
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới mua gần nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                    <SelectItem value="title_asc">Tên tác phẩm (A - Z)</SelectItem>
                    <SelectItem value="title_desc">Tên tác phẩm (Z - A)</SelectItem>
                    <SelectItem value="downloads">Tải nhiều nhất</SelectItem>
                    <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex items-center bg-sand/30 p-0.5 rounded-md border border-sand-light shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`size-7 rounded-sm transition-all ${viewMode === "list"
                      ? "bg-warm-cream text-forest shadow-xs font-bold"
                      : "text-muted-foreground hover:text-earth"
                      }`}
                    onClick={() => handleToggleViewMode("list")}
                    title="Chế độ danh sách chi tiết"
                  >
                    <List className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`size-7 rounded-sm transition-all ${viewMode === "grid"
                      ? "bg-warm-cream text-forest shadow-xs font-bold"
                      : "text-muted-foreground hover:text-earth"
                      }`}
                    onClick={() => handleToggleViewMode("grid")}
                    title="Chế độ lưới giá sách"
                  >
                    <LayoutGrid className="size-4" />
                  </Button>
                </div>

              </div>
            </div>

            {/* 3. Search Results Count & Active Filter Indicator */}
            {(searchQuery || formatFilter !== "all") && (
              <div className="flex items-center justify-between text-xs text-earth-muted px-1">
                <span>
                  Tìm thấy <strong className="text-earth font-semibold">{filteredPurchases.length}</strong> kết quả phù hợp
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFormatFilter("all");
                  }}
                  className="text-forest hover:text-forest-dark font-medium underline flex items-center gap-1"
                >
                  <FilterX className="size-3.5" /> Xóa bộ lọc
                </button>
              </div>
            )}

            {/* 4. Main Collection Presentation */}
            {filteredPurchases.length === 0 ? (
              /* No Filter Match State */
              <div className="py-12 text-center border border-dashed border-sand bg-warm-cream/30 rounded-xl">
                <FilterX className="mx-auto mb-2 size-8 text-earth-lighter" />
                <p className="text-sm font-semibold text-earth">Không tìm thấy tài liệu phù hợp</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Thử tìm với từ khóa khác hoặc xóa bộ lọc định dạng.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-sand bg-warm-cream text-earth rounded-md"
                  onClick={() => {
                    setSearchQuery("");
                    setFormatFilter("all");
                  }}
                >
                  Xóa tất cả bộ lọc
                </Button>
              </div>
            ) : viewMode === "list" ? (
              /* ================================================================= */
              /* A. DETAILED LIST VIEW (Chế độ Danh sách Chi tiết)                 */
              /* ================================================================= */
              <div className="space-y-3.5">
                {filteredPurchases.map((purchase) => {
                  const doc = purchase.document;
                  const coverImg = doc.coverImage || doc.previewImages?.[0];
                  const theme = getBookCoverTheme(doc._id);

                  return (
                    <Card
                      key={purchase._id}
                      className="border-2 border-sand-light bg-warm-cream/70 hover:bg-warm-cream/95 transition-all duration-200 rounded-xl overflow-hidden shadow-xs hover:border-sand"
                    >
                      <CardContent className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                        {/* Left: Cover & Info */}
                        <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">

                          {/* Book Cover Frame */}
                          <Link
                            href={`/documents/${doc.slug}/viewer`}
                            className="relative aspect-[1/1.38] w-14 sm:w-16 md:w-20 shrink-0 overflow-hidden rounded-md border border-sand-light bg-white group cursor-pointer shadow-xs block"
                          >
                            {coverImg ? (
                              <>
                                <img
                                  src={coverImg}
                                  alt={doc.title}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Eye className="size-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </>
                            ) : (
                              <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-1 justify-between relative`}>
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10"></div>
                                <span className="text-[5px] uppercase tracking-wider font-semibold opacity-75 truncate max-w-full text-center">
                                  {doc.category?.name || 'VĂN CHƯƠNG'}
                                </span>
                                <p className="font-bold text-[6px] leading-tight line-clamp-3 text-center my-auto px-0.5">
                                  {doc.title}
                                </p>
                                <span className="text-[5px] opacity-75 font-sans pt-0.5 border-t border-current/10 text-center">
                                  {doc.fileFormat?.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </Link>

                          {/* Title & Specs */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <Link
                              href={`/documents/${doc.slug}`}
                              className="font-bold text-sm sm:text-base text-earth hover:text-forest transition-colors leading-snug line-clamp-2"
                            >
                              {doc.title}
                            </Link>

                            <p className="text-xs text-muted-foreground italic line-clamp-1">
                              Tác giả: <strong className="text-earth-muted not-italic font-medium">{doc.author || 'Khuyết danh'}</strong>
                            </p>

                            {/* Quick Chips Row */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-earth-muted">
                              <Badge variant="outline" className="border-sand bg-warm-sand/40 text-earth-dark font-mono text-[10px] px-1.5 py-0 rounded-sm">
                                {doc.fileFormat?.toUpperCase()}
                              </Badge>
                              {doc.pageCount ? (
                                <span className="hidden sm:inline text-muted-foreground">• {doc.pageCount} trang</span>
                              ) : null}
                              <span>
                                Đã tải: <strong className="text-earth font-semibold">{purchase.downloadCount || 0}</strong> lần
                              </span>
                              {purchase.rating ? (
                                <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-500/10 border border-amber-300/40 px-1.5 py-0 rounded-sm font-semibold text-[10px]">
                                  <Star className="size-2.5 fill-amber-500 text-amber-500" />
                                  {purchase.rating}/5
                                </span>
                              ) : null}
                            </div>

                            {/* Short User Review Snippet if available */}
                            {purchase.review && (
                              <p className="text-xs text-earth-light italic line-clamp-1 pt-0.5">
                                &ldquo;{purchase.review}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions Group */}
                        <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-center justify-end border-t sm:border-t-0 border-sand-light/60 pt-3 sm:pt-0">

                          {/* 1. Primary Action: Đọc online */}
                          <Button
                            asChild
                            className="bg-forest hover:bg-forest-dark text-white font-medium text-xs sm:text-sm h-9.5 sm:h-10 px-4 rounded-md shadow-xs transition-all gap-2"
                          >
                            <Link href={`/documents/${doc.slug}/viewer`}>
                              <BookOpen className="size-4 text-pastel-green" />
                              <span>Đọc online</span>
                            </Link>
                          </Button>

                          {/* 2. Secondary Action: Tải file gốc */}
                          {doc.allowDownload !== false ? (
                            <Button
                              variant="outline"
                              className="border-sand bg-warm-ivory/80 hover:bg-warm-sand/50 text-earth hover:text-forest font-medium text-xs sm:text-sm h-9.5 sm:h-10 px-3.5 rounded-md shadow-xs transition-colors gap-2"
                              onClick={() => handleDownload(doc._id)}
                              disabled={downloadingId === doc._id}
                              title="Tải tệp tin gốc về máy"
                            >
                              {downloadingId === doc._id ? (
                                <Loader2 className="size-4 animate-spin text-forest" />
                              ) : (
                                <Download className="size-4 text-forest" />
                              )}
                              <span>Tải về</span>
                            </Button>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex cursor-not-allowed">
                                  <Button
                                    variant="outline"
                                    disabled
                                    className="border-sand bg-warm-ivory/40 text-earth-muted/50 font-medium text-xs sm:text-sm h-9.5 sm:h-10 px-3.5 rounded-md shadow-none pointer-events-none gap-2 opacity-50"
                                  >
                                    <Download className="size-4 text-earth-muted/40" />
                                    <span>Tải về</span>
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-earth text-warm-ivory text-xs px-2.5 py-1.5 rounded-md shadow-sm border border-sand">
                                <p className="flex items-center gap-1.5 font-medium">
                                  <span>Tài liệu chỉ được phép đọc online</span>
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* 3. Review Action (Opens Modal) */}
                          <Button
                            variant="outline"
                            className="border-sand bg-warm-ivory/80 hover:bg-warm-sand/50 text-earth-muted hover:text-earth font-medium text-xs sm:text-sm h-9.5 sm:h-10 px-3.5 rounded-md shadow-xs transition-colors gap-2"
                            onClick={() => openReviewModal(purchase)}
                            title={purchase.rating ? "Chỉnh sửa đánh giá của bạn" : "Viết nhận xét & đánh giá"}
                          >
                            <MessageSquare className="size-4 text-earth-lighter" />
                            <span>{purchase.rating ? "Sửa nhận xét" : "Đánh giá"}</span>
                          </Button>

                        </div>

                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* ================================================================= */
              /* B. BOOKSHELF GRID VIEW (Chế độ Lưới Giá Sách)                     */
              /* ================================================================= */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredPurchases.map((purchase) => {
                  const doc = purchase.document;
                  const coverImg = doc.coverImage || doc.previewImages?.[0];
                  const theme = getBookCoverTheme(doc._id);

                  return (
                    <Card
                      key={purchase._id}
                      className="border-2 border-sand-light bg-warm-cream/70 hover:bg-warm-cream transition-all duration-200 rounded-xl overflow-hidden shadow-xs hover:border-sand flex flex-col group h-full"
                    >
                      {/* Top: Book Cover */}
                      <Link
                        href={`/documents/${doc.slug}/viewer`}
                        className="relative aspect-[1/1.3] w-full overflow-hidden bg-sand/10 border-b border-sand-light/70 block cursor-pointer"
                      >
                        {coverImg ? (
                          <img
                            src={coverImg}
                            alt={doc.title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-2.5 justify-between relative`}>
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10"></div>
                            <span className="text-[7px] uppercase tracking-wider font-semibold opacity-75 truncate max-w-full text-center">
                              {doc.category?.name || 'VĂN CHƯƠNG'}
                            </span>
                            <p className="font-bold text-[9px] leading-tight line-clamp-3 text-center my-auto px-0.5">
                              {doc.title}
                            </p>
                            <span className="text-[7px] opacity-75 font-sans pt-0.5 border-t border-current/10 text-center">
                              {doc.fileFormat?.toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Format Badge Overlay */}
                        <Badge
                          variant="secondary"
                          className="absolute top-2 left-2 text-[9px] font-mono font-bold bg-black/60 text-white border-none backdrop-blur-xs px-1.5 py-0 rounded-xs"
                        >
                          {doc.fileFormat?.toUpperCase()}
                        </Badge>
                      </Link>

                      {/* Middle: Content */}
                      <CardContent className="p-3 flex-1 flex flex-col justify-between gap-2">
                        <div>
                          <Link
                            href={`/documents/${doc.slug}`}
                            className="font-bold text-xs sm:text-sm text-earth hover:text-forest transition-colors leading-snug line-clamp-2"
                          >
                            {doc.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground italic mt-0.5 line-clamp-1">
                            Tác giả: {doc.author || 'Khuyết danh'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-earth-lighter border-t border-sand-light/60 pt-2">
                          <span>Đã tải: <strong className="text-earth font-semibold">{purchase.downloadCount || 0}</strong></span>
                          {purchase.rating ? (
                            <button
                              type="button"
                              onClick={() => openReviewModal(purchase)}
                              className="inline-flex items-center gap-0.5 text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                              title="Bấm để xem hoặc sửa đánh giá"
                            >
                              <Star className="size-2.5 fill-amber-500 text-amber-500" />
                              {purchase.rating}/5
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openReviewModal(purchase)}
                              className="text-forest hover:text-forest-dark hover:underline font-medium text-[10px] cursor-pointer"
                            >
                              Đánh giá
                            </button>
                          )}
                        </div>
                      </CardContent>

                      {/* Bottom: Quick Actions Bar */}
                      <div className="p-3 pt-0 flex items-center gap-2">
                        <Button
                          asChild
                          className="flex-1 bg-forest hover:bg-forest-dark text-white font-medium text-xs h-9 rounded-md shadow-xs gap-1.5"
                        >
                          <Link href={`/documents/${doc.slug}/viewer`}>
                            <BookOpen className="size-3.5 text-pastel-green" />
                            <span>Đọc online</span>
                          </Link>
                        </Button>

                        {doc.allowDownload !== false ? (
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-9 shrink-0 border-sand bg-warm-ivory/80 hover:bg-warm-sand/50 text-earth rounded-md shadow-xs"
                            onClick={() => handleDownload(doc._id)}
                            disabled={downloadingId === doc._id}
                            title="Tải tệp tin gốc về máy"
                          >
                            {downloadingId === doc._id ? (
                              <Loader2 className="size-3.5 animate-spin text-forest" />
                            ) : (
                              <Download className="size-3.5 text-forest" />
                            )}
                          </Button>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-not-allowed">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled
                                  className="size-9 shrink-0 border-sand-light/80 bg-warm-ivory/40 text-earth-lighter/70 rounded-md shadow-none pointer-events-none opacity-60"
                                >
                                  <Download className="size-3.5 text-earth-lighter/60" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-earth text-warm-ivory text-xs px-2.5 py-1.5 rounded-md shadow-sm border border-sand">
                              <p className="flex items-center gap-1.5 font-medium">
                                <span>Tài liệu chỉ được phép đọc online</span>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                    </Card>
                  );
                })}
              </div>
            )}

            {/* 5. Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-sand bg-warm-cream text-earth font-medium hover:bg-sand/20 text-xs rounded-md"
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
                  className="border-sand bg-warm-cream text-earth font-medium hover:bg-sand/20 text-xs rounded-md"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </>
        )}

        {/* =================================================================== */}
        {/* 6. REVIEW DIALOG (Shadcn Dialog Modal)                              */}
        {/* =================================================================== */}
        <Dialog
          open={Boolean(reviewDialogTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setReviewDialogTarget(null);
              setReviewDraft("");
            }
          }}
        >
          <DialogContent className="border-2 border-sand bg-warm-cream text-earth sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-bold text-earth flex items-center gap-2">
                <Star className="size-5 fill-gold text-gold" />
                <span>Đánh giá & Cảm nhận tác phẩm</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Chia sẻ cảm nhận học thuật hoặc trải nghiệm đọc của bạn về tác phẩm này.
              </DialogDescription>
            </DialogHeader>

            {reviewDialogTarget && (
              <div className="space-y-4 pt-1">

                {/* Document mini banner in dialog */}
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-sand-light bg-warm-ivory/70">
                  <div className="aspect-[1/1.38] w-10 shrink-0 overflow-hidden rounded-sm border border-sand-light bg-white">
                    {reviewDialogTarget.document.coverImage || reviewDialogTarget.document.previewImages?.[0] ? (
                      <img
                        src={reviewDialogTarget.document.coverImage || reviewDialogTarget.document.previewImages[0]}
                        alt={reviewDialogTarget.document.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-forest text-pastel-green flex items-center justify-center text-[7px] font-bold">
                        {reviewDialogTarget.document.fileFormat?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-earth line-clamp-1">{reviewDialogTarget.document.title}</p>
                    <p className="text-[11px] text-muted-foreground italic">Tác giả: {reviewDialogTarget.document.author || 'Khuyết danh'}</p>
                  </div>
                </div>

                {/* Star Rating Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-earth">Mức độ hài lòng:</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        aria-label={`Chọn ${score} sao`}
                        onClick={() => setRatingDraft(score)}
                        className="p-1 rounded-md hover:bg-sand/30 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`size-6 transition-colors ${score <= ratingDraft
                            ? "fill-gold text-gold"
                            : "text-sand-dark/60"
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-earth">
                      {ratingDraft === 5 && "Xuất sắc"}
                      {ratingDraft === 4 && "Rất tốt"}
                      {ratingDraft === 3 && "Hữu ích"}
                      {ratingDraft === 2 && "Tạm ổn"}
                      {ratingDraft === 1 && "Cần cải thiện"}
                    </span>
                  </div>
                </div>

                {/* Review Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="review-text" className="font-semibold text-earth">Nhận xét chi tiết (tùy chọn):</label>
                    <span className="text-[10px] text-muted-foreground">{reviewDraft.length}/1000</span>
                  </div>
                  <Textarea
                    id="review-text"
                    rows={4}
                    maxLength={1000}
                    value={reviewDraft}
                    onChange={(e) => setReviewDraft(e.target.value)}
                    placeholder="Nội dung tài liệu có đáp ứng đúng mong đợi của bạn không? Bạn có gợi ý gì cho cộng đồng học tập không..."
                    className="bg-warm-ivory/50 border-sand text-xs focus-visible:ring-forest text-earth rounded-md resize-none"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-sand bg-warm-cream text-earth-muted hover:bg-sand/20 text-xs rounded-md"
                onClick={() => {
                  setReviewDialogTarget(null);
                  setReviewDraft("");
                }}
                disabled={savingReview}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                className="bg-forest hover:bg-forest-dark text-white font-semibold text-xs rounded-md shadow-xs"
                onClick={handleSubmitReview}
                disabled={savingReview}
              >
                {savingReview ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                {reviewDialogTarget?.rating ? "Cập nhật đánh giá" : "Gửi đánh giá"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}

