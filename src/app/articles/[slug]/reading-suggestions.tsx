"use client";

import { useState } from "react";
//import { getReadingSuggestions } from "@/ai/flows/reading-suggestions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2, BookText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReadingSuggestions({ articleContent }: { articleContent: string }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      // const result = await getReadingSuggestions({ articleContent });
      /*if (result.suggestions && result.suggestions.length > 0) {
        setSuggestions(result.suggestions);
      } else {*/
        setError("Không tìm thấy gợi ý nào phù hợp.");
      //}
    } catch (e) {
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
      <Card className="bg-background/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-2xl">
            <Lightbulb className="h-7 w-7 text-accent" />
            <span>Gợi ý đọc thêm từ AI</span>
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Dựa trên nội dung bài viết, AI đề xuất những tác phẩm hoặc tác giả bạn có thể sẽ thích.
          </p>
        </CardHeader>
        <CardContent>
          {!isLoading && suggestions.length === 0 && (
             <div className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground mb-4">Nhấn nút để nhận gợi ý từ trí tuệ nhân tạo.</p>
                <Button onClick={handleGetSuggestions} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tìm kiếm gợi ý
                </Button>
             </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
              <span className="text-muted-foreground">AI đang suy nghĩ...</span>
            </div>
          )}

          {!isLoading && error && (
            <p className="text-destructive text-center p-6">{error}</p>
          )}

          {!isLoading && suggestions.length > 0 && (
            <div>
              <ul className="space-y-3 list-none">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-card rounded-md">
                    <BookText className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={handleGetSuggestions} variant="link" className="mt-4">Thử lại với gợi ý khác</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
