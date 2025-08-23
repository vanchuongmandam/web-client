"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ArticleSearchData {
  id: string;
  slug: string;
  title: string;
  content_snippet: string;
  category_slug?: string;
  date?: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ArticleSearchData[]>([]);
  const [allArticles, setAllArticles] = useState<ArticleSearchData[]>([]);
  const router = useRouter();

  // Load search data once
  useEffect(() => {
    async function loadSearchData() {
      try {
        const response = await fetch("/search-data.json");
        if (!response.ok) {
          throw new Error("Failed to load search data.");
        }
        const data: ArticleSearchData[] = await response.json();
        setAllArticles(data);
      } catch (error) {
        console.error("Error loading search data:", error);
      }
    }
    loadSearchData();
  }, []);

  const handleSearch = useCallback((query: string) => {
    const lowercasedQuery = query.toLowerCase();
    if (!lowercasedQuery) {
      setSearchResults([]);
      return;
    }

    const filtered = allArticles.filter(article =>
      article.title.toLowerCase().includes(lowercasedQuery) ||
      article.content_snippet.toLowerCase().includes(lowercasedQuery) ||
      article.category_slug?.toLowerCase().includes(lowercasedQuery)
    );
    setSearchResults(filtered);
  }, [allArticles]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // Debounce search to avoid too many updates

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearch]);

  const handleResultClick = () => {
    onClose();
    setSearchQuery(""); // Clear search query after navigation
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tìm kiếm bài viết</DialogTitle>
          <DialogDescription>
            Tìm kiếm bài viết theo tiêu đề, nội dung hoặc chuyên mục.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            type="text"
            placeholder="Nhập từ khóa tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex-grow overflow-y-auto">
          {searchQuery && searchResults.length === 0 && (
            <p className="text-center text-gray-500">Không tìm thấy kết quả nào.</p>
          )}
          {searchResults.map((article) => (
            <Link key={article.id} href={`/articles/${article.slug}`} onClick={handleResultClick}>
              <Card className="mb-2 hover:bg-gray-100 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <CardTitle className="text-lg font-semibold">{article.title}</CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">{article.content_snippet}</p>
                  {article.category_slug && (
                    <p className="text-xs text-primary mt-1">Chuyên mục: {article.category_slug}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
