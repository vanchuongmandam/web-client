"use client";

import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { getArticleSuggestions } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReadingSuggestionsProps {
  currentSlug: string;
  categoryId: string;
}

export default function ReadingSuggestions({ currentSlug, categoryId }: ReadingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const data = await getArticleSuggestions(currentSlug, categoryId);
      if (data && data.length > 0) {
        setSuggestions(data);
      } else {
        setError("Không tìm thấy gợi ý nào phù hợp.");
      }
      setHasFetched(true);
    } catch (e: any) {
      console.error(e);
      setError("Đã có lỗi xảy ra khi lấy gợi ý. Vui lòng thử lại.");
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lấy gợi ý đọc thêm vào lúc này.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <Card className="border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 rounded-xl overflow-hidden shadow-xs font-sans">
        <CardHeader className="pb-3 border-b border-[#e6dfd3]">
          <CardTitle className="flex items-center gap-3 font-headline text-xl text-[#4c6b54]">
            <Lightbulb className="h-6 w-6 text-amber-600 animate-pulse" />
            <span>Gợi ý đọc thêm</span>
          </CardTitle>
          <p className="text-muted-foreground text-xs mt-1">
            Dựa trên chuyên mục của bài viết hiện tại, đây là những nội dung liên quan chúng tôi đề xuất cho bạn.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          {!isLoading && !hasFetched && suggestions.length === 0 && (
             <div className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2 border-[#e6dfd3] rounded-lg bg-white/50">
                <p className="text-muted-foreground text-sm mb-4">Nhấn nút để nhận đề xuất các bài đọc liên quan.</p>
                <Button onClick={handleGetSuggestions} disabled={isLoading} className="bg-[#4c6b54] hover:bg-[#3d5643] text-white rounded-md">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tìm kiếm gợi ý
                </Button>
             </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#4c6b54] mb-2" />
              <span className="text-muted-foreground text-sm">Đang tìm kiếm gợi ý đọc thêm...</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center p-6 bg-white/50 border border-[#e6dfd3] rounded-lg">
              <p className="text-destructive text-sm mb-3">{error}</p>
              <Button onClick={handleGetSuggestions} variant="outline" className="border-[#4c6b54] text-[#4c6b54] hover:bg-[#fcf9f2] rounded-md">Thử lại</Button>
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suggestions.map((article) => (
                  <Link key={article.slug} href={`/articles/${article.slug}`}>
                    <Card className="h-full border border-[#e6dfd3] bg-white rounded-lg hover:border-[#4c6b54] shadow-xs transition-all group duration-300">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-[#4c6b54] transition-colors leading-snug">
                          {article.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-xs">
                        <p className="text-muted-foreground line-clamp-3 mb-2">
                          {article.excerpt}
                        </p>
                        <div className="flex justify-between items-center text-slate-500 mt-3 pt-2 border-t border-slate-100">
                          <span>{article.author}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <Button onClick={handleGetSuggestions} variant="link" className="mt-4 text-[#4c6b54] hover:text-[#3d5643] text-xs p-0 font-bold">
                Tải lại gợi ý khác
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
