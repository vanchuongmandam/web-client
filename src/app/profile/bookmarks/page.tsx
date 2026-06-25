// src/app/profile/bookmarks/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBookmarks, toggleBookmark } from "@/lib/api";
import type { MarketDocument } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookmarkX, Eye, Star, BookOpen } from "lucide-react";
import Link from "next/link";

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

function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function BookmarksPage() {
  const { token, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<MarketDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadBookmarks();
    }
  }, [token]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const res = await getBookmarks(token!, { limit: 50 });
      setDocuments(res.data);
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (documentId: string) => {
    if (!token) return;
    try {
      await toggleBookmark(documentId, token);
      setDocuments(prev => prev.filter(d => d._id !== documentId));
      refreshProfile(); // update context
      toast({ title: "Đã bỏ lưu tài liệu" });
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12 bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-primary">Tài liệu đã lưu</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Danh sách các tài liệu bạn đã đánh dấu yêu thích để xem lại sau.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl bg-muted/10 min-h-[300px]">
          <BookOpen className="h-14 w-14 text-primary opacity-25 mb-3" />
          <h3 className="text-sm font-bold text-foreground">Danh sách lưu trống</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4 leading-relaxed">Bạn chưa đánh dấu lưu bất kỳ tài liệu văn học nào.</p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Link href="/documents">Khám phá Kho tài liệu</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const theme = getBookCoverTheme(doc._id);
            return (
              <Card key={doc._id} className="overflow-hidden flex flex-col group border border-border bg-card/70 hover:bg-card rounded-xl overflow-hidden hover:border-primary/60 transition-all duration-300 shadow-[2px_2px_8px_rgba(0,0,0,0.02)]">
                
                {/* Book Cover container */}
                <Link href={`/documents/${doc.slug}`} className="p-3 bg-muted/30 border-b border-border relative flex justify-center h-40 md:h-44 items-center">
                  {doc.previewImages?.[0] ? (
                    // Flat preview image
                    <div className="relative aspect-[1/1.38] h-full overflow-hidden rounded border border-border bg-card p-1 shadow-sm">
                      <img 
                        src={doc.previewImages[0]} 
                        alt={doc.title} 
                        className="h-full w-full object-cover rounded" 
                      />
                    </div>
                  ) : (
                    // 3D book cover representation
                    <div className="relative aspect-[1/1.38] h-full overflow-hidden rounded shadow-[3px_3px_8px_rgba(0,0,0,0.15),-1px_0px_2px_rgba(0,0,0,0.08)] border border-border/10 transition-transform duration-300 group-hover:scale-[1.02]">
                      <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-2.5 justify-between relative`}>
                        {/* Spine crease shadow */}
                        <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10"></div>
                        
                        <div className="border border-current/15 rounded p-1 flex-1 flex flex-col justify-between items-center text-center relative">
                          <span className="text-[7px] uppercase tracking-[0.1em] font-semibold opacity-70 truncate max-w-full">
                            {doc.category?.name || 'TÀI LIỆU'}
                          </span>
                          
                          <div className="my-auto py-1">
                            <h4 className="font-bold text-[10px] leading-tight line-clamp-3 text-center px-0.5">
                              {doc.title}
                            </h4>
                            <div className="w-6 h-[0.5px] bg-current opacity-30 mx-auto my-1.5 relative"></div>
                            <p className="text-[8px] italic opacity-85 line-clamp-1">
                              {doc.author}
                            </p>
                          </div>
                          
                          <div className="w-full flex items-center justify-between text-[7px] opacity-75 font-sans pt-0.5 border-t border-current/10">
                            <span>{doc.fileFormat.toUpperCase()}</span>
                            {doc.pageCount && <span>{doc.pageCount}T</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Link>

                {/* Card Content details */}
                <CardContent className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/documents/${doc.slug}`}>
                      <h3 className="font-bold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug mb-1" title={doc.title}>
                        {doc.title}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-muted-foreground italic line-clamp-1">Tác giả: {doc.author || 'Khuyết danh'}</p>
                    
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/60 pt-2.5">
                      <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" /> {doc.viewCount || 0}</span>
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-[#cbb685] text-[#cbb685]" /> 
                        <strong className="text-foreground">{doc.rating?.average > 0 ? doc.rating.average.toFixed(1) : 'Chưa có'}</strong>
                      </span>
                      <span className={`font-bold ${doc.isFree ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(doc.price)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2 border-t border-border/40 pt-3">
                    <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-8" size="sm">
                      <Link href={`/documents/${doc.slug}`}>Chi tiết</Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0 border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => handleRemoveBookmark(doc._id)}
                      title="Bỏ lưu"
                    >
                      <BookmarkX className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
