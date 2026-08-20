// src/app/profile/bookmarks/page.tsx

"use client";

import { toErrorMessage } from "@/lib/errors";

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
    { bg: 'bg-category-brown', text: 'text-pastel-warm', border: 'border-category-red-dark', tagBg: 'bg-category-red-dark/40 text-pastel-warm/90', lineBg: 'bg-category-copper' }, // Warm Mahogany
    { bg: 'bg-forest-deepest', text: 'text-pastel-green', border: 'border-forest-night', tagBg: 'bg-forest-night/40 text-pastel-green/90', lineBg: 'bg-forest' }, // Forest Moss
    { bg: 'bg-category-purple-dark', text: 'text-pastel-purple', border: 'border-category-purple-night', tagBg: 'bg-category-purple-night/40 text-pastel-purple/90', lineBg: 'bg-category-purple' }, // Dark Aubergine
    { bg: 'bg-category-blue-dark', text: 'text-pastel-blue', border: 'border-category-blue-night', tagBg: 'bg-category-blue-night/40 text-pastel-blue/90', lineBg: 'bg-category-blue' }, // Slate Ocean
    { bg: 'bg-warm-sand', text: 'text-earth-dark', border: 'border-sand-dark', tagBg: 'bg-earth-dark/15 text-earth-dark/95', lineBg: 'bg-sand-muted' }, // Vintage Parchment
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
    } catch (e) {
      toast({ title: "Lỗi", description: toErrorMessage(e), variant: "destructive" });
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
    } catch (e) {
      toast({ title: "Lỗi", description: toErrorMessage(e), variant: "destructive" });
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
            const coverImg = doc.coverImage?.trim() || 
              (Array.isArray(doc.previewImages) && doc.previewImages.length > 0 ? doc.previewImages[0] : null) ||
              (doc.previewFile && typeof doc.previewFile === 'string' && doc.previewFile.trim() !== '' && !doc.previewFile.toLowerCase().endsWith('.pdf') && !doc.previewFile.toLowerCase().endsWith('.zip') && !doc.previewFile.toLowerCase().endsWith('.docx') ? doc.previewFile : null);

            return (
              <Card key={doc._id} className="overflow-hidden flex flex-col group border border-border bg-card/70 hover:bg-card rounded-xl hover:border-primary/60 transition-all duration-300 shadow-xs">
                
                {/* Book Cover container */}
                <Link href={`/documents/${doc.slug}`} className="relative w-full aspect-[4/3] overflow-hidden bg-muted/30 border-b border-border block">
                  {coverImg ? (
                    <img 
                      src={coverImg} 
                      alt={doc.title} 
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    // 3D book cover representation
                    <div className="relative h-full w-full overflow-hidden transition-transform duration-300 group-hover:scale-105">
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
                        <Star className="w-3 h-3 fill-gold text-gold" /> 
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
