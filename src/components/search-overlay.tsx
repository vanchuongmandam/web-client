"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  X,
  Clock,
  Sparkles,
  BookOpen,
  FileText,
  ArrowRight,
  TrendingUp,
  SearchX,
  Star,
  CornerDownLeft,
  Trash2,
} from "lucide-react";
import { search, getTrendingTopics, type SearchHit } from "@/lib/api/search";
import { formatVietnameseDate, getMediaUrl } from "@/lib/utils";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = "vcmd_recent_searches";
const MAX_RECENT_SEARCHES = 6;

// In-memory session cache — avoids refetching trending topics on every open,
// mirroring the `revalidate: 3600` server-side cache configured in the API helper.
let cachedTrendingTopics: string[] | null = null;

const HL_PATTERN = /__HL_START__(.*?)__HL_END__/g;

interface HighlightPart {
  text: string;
  highlight: boolean;
}

/** Split a string containing `__HL_START__` / `__HL_END__` markers into safe React parts. */
function splitHighlight(text: string): HighlightPart[] {
  const parts: HighlightPart[] = [];
  HL_PATTERN.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HL_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlight: false });
    }
    if (match[1]) parts.push({ text: match[1], highlight: true });
    lastIndex = HL_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), highlight: false });
  return parts;
}

/** Render highlighted text as React elements (never `dangerouslySetInnerHTML`). */
function Highlight({ text }: { text: string }) {
  const parts = useMemo(() => splitHighlight(text || ""), [text]);
  if (parts.length === 0) return null;
  return (
    <>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="bg-primary/20 text-primary font-medium rounded-xs px-0.5">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

function formatPrice(hit: SearchHit): string {
  if (hit.isFree) return "Miễn phí";
  return `${(hit.price ?? 0).toLocaleString("vi-VN")}đ`;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "articles" | "documents">("all");
  const [articles, setArticles] = useState<SearchHit[]>([]);
  const [documents, setDocuments] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // Load recent searches from localStorage on mount / open
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      } catch {
        // Ignore JSON parse errors
      }
      // Auto-focus input with a small delay for smooth animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const saveRecentSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage quota errors
      }
      return next;
    });
  }, []);

  const removeRecentSearch = useCallback((queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item !== queryToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore errors
      }
      return next;
    });
  }, []);

  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore errors
    }
  }, []);

  // Debounced search with AbortController
  useEffect(() => {
    const q = searchQuery.trim();
    setActiveIndex(-1);

    if (!q) {
      setArticles([]);
      setDocuments([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await search({ q, type: activeTab, limit: 20, signal: controller.signal });
        setArticles(data.articles);
        setDocuments(data.documents);
        setError(null);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setArticles([]);
        setDocuments([]);
        setError("Đã có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, activeTab]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setActiveTab("all");
      setArticles([]);
      setDocuments([]);
      setError(null);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Load trending topics once per session (server revalidates hourly via `revalidate`).
  useEffect(() => {
    if (!isOpen) return;

    // Serve from cache immediately on reopen.
    if (cachedTrendingTopics !== null) {
      setTrendingTopics(cachedTrendingTopics);
      setTrendingLoading(false);
      return;
    }

    let cancelled = false;
    setTrendingLoading(true);

    getTrendingTopics()
      .then((topics) => {
        cachedTrendingTopics = topics;
        if (!cancelled) setTrendingTopics(topics);
      })
      .catch(() => {
        if (!cancelled) setTrendingTopics([]);
      })
      .finally(() => {
        if (!cancelled) setTrendingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Interleave hits for "all" tab
  const displayHits = useMemo(() => {
    if (activeTab === "articles") return articles;
    if (activeTab === "documents") return documents;
    const interleaved: SearchHit[] = [];
    const max = Math.max(articles.length, documents.length);
    for (let i = 0; i < max; i++) {
      if (articles[i]) interleaved.push(articles[i]);
      if (documents[i]) interleaved.push(documents[i]);
    }
    return interleaved;
  }, [articles, documents, activeTab]);

  const hasQuery = searchQuery.trim().length > 0;
  const isEmpty = hasQuery && !loading && !error && displayHits.length === 0;
  const totalCount = articles.length + documents.length;

  const handleSelectHit = useCallback(
    (hit: SearchHit) => {
      saveRecentSearch(searchQuery);
      onClose();
      const href = hit.type === "article" ? `/articles/${hit.slug}` : `/documents/${hit.slug}`;
      router.push(href);
    },
    [router, onClose, saveRecentSearch, searchQuery]
  );

  const handleTopicClick = useCallback((topic: string) => {
    setSearchQuery(topic);
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation inside list
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (displayHits.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < displayHits.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : displayHits.length - 1));
      } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < displayHits.length) {
        e.preventDefault();
        handleSelectHit(displayHits[activeIndex]);
      }
    },
    [displayHits, activeIndex, handleSelectHit]
  );

  // Auto-scroll to active item
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseButton
        className="sm:max-w-[700px] max-h-[85vh] p-0 overflow-hidden border border-border rounded-xl bg-card shadow-xs flex flex-col font-sans gap-0"
      >
        <DialogTitle className="sr-only">Tìm kiếm</DialogTitle>
        <DialogDescription className="sr-only">
          Tìm kiếm bài viết và tài liệu trên Văn Chương Mạn Đàm
        </DialogDescription>

        {/* --- Top Search Bar --- */}
        <div className="flex items-center px-4 border-b border-border/80 bg-background/50 relative">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm bài viết, tài liệu, tác giả, chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-14 pl-3 pr-14 bg-transparent border-0 text-base placeholder:text-muted-foreground/60 text-foreground focus:outline-none"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0 mr-1" />}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                if (searchQuery) {
                  setSearchQuery("");
                  inputRef.current?.focus();
                } else {
                  onClose();
                }
              }}
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
              title={searchQuery ? "Xóa từ khóa" : "Đóng tìm kiếm (ESC)"}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{searchQuery ? "Xóa từ khóa" : "Đóng tìm kiếm"}</span>
            </Button>
          </div>
        </div>

        {/* --- Filter Tabs (Visible when typing or has query) --- */}
        <div className="px-4 py-2.5 bg-muted/20 border-b border-border/60 flex items-center justify-between">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-8 p-0.5 bg-muted/60 border border-border/40 rounded-md">
              <TabsTrigger
                value="all"
                className="text-xs h-7 px-3 rounded-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
              >
                Tất cả
                {hasQuery && totalCount > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-70">({totalCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="articles"
                className="text-xs h-7 px-3 rounded-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
              >
                Bài viết
                {hasQuery && articles.length > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-70">({articles.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="text-xs h-7 px-3 rounded-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
              >
                Tài liệu
                {hasQuery && documents.length > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-70">({documents.length})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {hasQuery && !loading && totalCount > 0 && (
            <span className="hidden sm:inline-block text-[11px] text-muted-foreground">
              Tìm thấy <strong className="text-foreground">{totalCount}</strong> kết quả
            </span>
          )}
        </div>

        {/* --- Content Area --- */}
        <div
          ref={listRef}
          className="flex-grow overflow-y-auto max-h-[55vh] min-h-[220px] p-3 focus:outline-none"
        >
          {/* STATE 1: Empty Query -> Show Recent Searches & Popular Topics */}
          {!hasQuery && (
            <div className="space-y-6 py-2 px-1">
              {/* Lịch sử tìm kiếm gần đây */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      Tìm kiếm gần đây
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllRecentSearches}
                      className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Xóa tất cả
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleTopicClick(item)}
                        className="inline-flex items-center gap-1.5 text-xs bg-muted/50 hover:bg-muted text-foreground border border-border/70 rounded-full px-3 py-1 cursor-pointer transition-colors group"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(item, e)}
                          className="text-muted-foreground/60 hover:text-destructive rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Xóa</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chủ đề gợi ý */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Chủ đề thịnh hành</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingLoading ? (
                    // Light skeleton placeholders while the API loads.
                    <>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-6 w-20 rounded-full bg-muted/40 animate-pulse border border-border/40"
                          style={{ width: `${[5, 7, 6, 8, 5, 6][i]}rem` }}
                        />
                      ))}
                    </>
                  ) : (
                    trendingTopics.map((topic) => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        onClick={() => handleTopicClick(topic)}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all text-xs font-normal py-1 px-3 rounded-full border border-border/40"
                      >
                        {topic}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Lối tắt truy cập nhanh */}
              <div className="pt-2 border-t border-border/60">
                <span className="text-xs font-semibold text-muted-foreground mb-2.5 block">
                  Khám phá nhanh
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link
                    href="/documents"
                    onClick={onClose}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border/70 hover:bg-accent/60 hover:border-primary/40 transition-all group"
                  >
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Kho tài liệu chọn lọc
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Giáo án, đề thi, chuyên đề văn học
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/articles"
                    onClick={onClose}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border/70 hover:bg-accent/60 hover:border-primary/40 transition-all group"
                  >
                    <div className="h-8 w-8 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Tất cả bài viết
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Phê bình, sáng tác, tản văn & hướng dẫn
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: Loading Indicator */}
          {loading && (
            <div className="space-y-2.5 py-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse p-3 rounded-lg border border-border/50 bg-muted/20 flex items-start gap-3"
                >
                  <div className="h-12 w-12 rounded-md bg-muted/60 shrink-0" />
                  <div className="flex-grow space-y-2">
                    <div className="h-4 bg-muted/60 rounded w-3/4" />
                    <div className="h-3 bg-muted/40 rounded w-full" />
                    <div className="h-3 bg-muted/30 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STATE 3: Error */}
          {!loading && error && (
            <div className="text-center py-10 px-4">
              <SearchX className="h-10 w-10 text-destructive/60 mx-auto mb-2" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* STATE 4: Empty Results */}
          {isEmpty && (
            <div className="text-center py-12 px-4">
              <SearchX className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">
                Không tìm thấy kết quả phù hợp cho &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Hãy thử kiểm tra lại chính tả hoặc tìm kiếm bằng từ khóa ngắn gọn, phổ biến hơn.
              </p>
            </div>
          )}

          {/* STATE 5: Results List */}
          {!loading &&
            !error &&
            displayHits.length > 0 &&
            displayHits.map((hit, index) => {
              const isSelected = activeIndex === index;
              const isArticle = hit.type === "article";
              const coverSrc = isArticle ? getMediaUrl(hit.coverUrl) : getMediaUrl(hit.coverImage);

              return (
                <div
                  key={`${hit.type}-${hit.id}`}
                  data-index={index}
                  onClick={() => handleSelectHit(hit)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`group mb-2 p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 relative ${isSelected
                    ? "bg-accent border-primary/40 shadow-2xs"
                    : "border-border/60 bg-card hover:bg-accent/50 hover:border-border"
                    }`}
                >
                  {/* Thumbnail / Visual Icon */}
                  <div className="h-14 w-14 rounded-md bg-muted/60 border border-border/40 shrink-0 overflow-hidden flex items-center justify-center relative">
                    {coverSrc ? (
                      <Image
                        src={coverSrc}
                        alt={hit.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : isArticle ? (
                      <FileText className="h-6 w-6 text-muted-foreground/70" />
                    ) : (
                      <BookOpen className="h-6 w-6 text-primary/70" />
                    )}
                  </div>

                  {/* Main Content Info */}
                  <div className="flex-grow min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      {hit.category && (
                        <span className="text-[11px] font-medium text-primary line-clamp-1">
                          {hit.category.name}
                        </span>
                      )}
                      {hit.category && <span className="text-muted-foreground/50 text-[10px]">·</span>}
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {hit.author || "Văn Chương Mạn Đàm"}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                      <Highlight text={hit.title} />
                    </h3>

                    {hit.snippet && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        <Highlight text={hit.snippet} />
                      </p>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex items-center gap-2.5 mt-2 text-[11px] text-muted-foreground">
                      {isArticle ? (
                        hit.publishTimestamp && (
                          <span>{formatVietnameseDate(new Date(hit.publishTimestamp))}</span>
                        )
                      ) : (
                        <>
                          <span className="font-semibold text-primary">{formatPrice(hit)}</span>
                          {hit.fileFormat && (
                            <span className="uppercase text-[10px] bg-muted px-1.5 py-0.2 rounded-xs border border-border/50 font-mono">
                              {hit.fileFormat}
                            </span>
                          )}
                          {hit.rating && hit.rating.average > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              {hit.rating.average.toFixed(1)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Type Badge & Action Hint */}
                  <div className="shrink-0 flex flex-col items-end justify-between h-full gap-2">
                    <Badge
                      variant={isArticle ? "secondary" : "outline"}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    >
                      {isArticle ? "Bài viết" : "Tài liệu"}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
        </div>

        {/* --- Bottom Navigation Guide & Status Footer --- */}
        <div className="bg-muted/40 border-t border-border/80 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 text-[9px] bg-background border border-border rounded-xs font-mono">
                ↑↓
              </kbd>
              Di chuyển
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 text-[9px] bg-background border border-border rounded-xs font-mono flex items-center">
                <CornerDownLeft className="h-2.5 w-2.5" />
              </kbd>
              Chọn
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 text-[9px] bg-background border border-border rounded-xs font-mono">
                ESC
              </kbd>
              Đóng
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Tìm kiếm AI</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
