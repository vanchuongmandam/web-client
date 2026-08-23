"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { search, type SearchHit } from "@/lib/api/search";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

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
          <mark key={i} className="bg-primary/20 text-primary font-medium rounded-sm px-0.5">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

function formatPrice(hit: SearchHit) {
  if (hit.isFree) return "Miễn phí";
  return `${(hit.price ?? 0).toLocaleString("vi-VN")}đ`;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "articles" | "documents">("all");
  const [articles, setArticles] = useState<SearchHit[]>([]);
  const [documents, setDocuments] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch with 300ms debounce + AbortController to cancel stale requests.
  useEffect(() => {
    const q = searchQuery.trim();
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
        setError("Đã có lỗi xảy ra khi tìm kiếm.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, activeTab]);

  // Reset state when the overlay closes.
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setActiveTab("all");
      setArticles([]);
      setDocuments([]);
      setError(null);
    }
  }, [isOpen]);

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

  const handleResultClick = () => {
    onClose();
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tìm kiếm</DialogTitle>
          <DialogDescription>
            Tìm kiếm bài viết và tài liệu theo tiêu đề, nội dung hoặc chuyên mục.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          <Input
            type="text"
            placeholder="Nhập từ khóa tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            autoFocus
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="articles">Bài viết</TabsTrigger>
            <TabsTrigger value="documents">Tài liệu</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-grow overflow-y-auto mt-2">
          {loading && <p className="text-center text-muted-foreground py-6">Đang tìm kiếm...</p>}
          {error && <p className="text-center text-muted-foreground py-6">{error}</p>}
          {isEmpty && (
            <p className="text-center text-muted-foreground py-6">Không tìm thấy kết quả nào.</p>
          )}

          {!loading &&
            !error &&
            displayHits.map((hit) => {
              const href = hit.type === "article" ? `/articles/${hit.slug}` : `/documents/${hit.slug}`;
              return (
                <Link key={`${hit.type}-${hit.id}`} href={href} onClick={handleResultClick}>
                  <div className="mb-2 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold leading-snug">
                        <Highlight text={hit.title} />
                      </h3>
                      <Badge variant={hit.type === "article" ? "secondary" : "outline"}>
                        {hit.type === "article" ? "Bài viết" : "Tài liệu"}
                      </Badge>
                    </div>
                    {hit.snippet && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        <Highlight text={hit.snippet} />
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {hit.category && <span>{hit.category.name}</span>}
                      {hit.author && (
                        <>
                          <span>·</span>
                          <span>{hit.author}</span>
                        </>
                      )}
                      {hit.type === "document" && (
                        <>
                          <span>·</span>
                          <span>{formatPrice(hit)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
