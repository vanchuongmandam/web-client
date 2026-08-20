// src/components/documents/DocumentSuggestions.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getRelatedDocuments, getSuggestions } from "@/lib/api";
import type { MarketDocument } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, BookOpen, Star, Sparkles, Layers, Eye, Download } from "lucide-react";
import Link from "next/link";

interface Props {
  documentId: string;
}

// Helper to determine book cover theme dynamically (identical to document-list-client)
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

function DocumentCard({ doc }: { doc: MarketDocument }) {
  const theme = getBookCoverTheme(doc._id);
  const coverImg = doc.coverImage?.trim() || 
    (Array.isArray(doc.previewImages) && doc.previewImages.length > 0 ? doc.previewImages[0] : null) ||
    (doc.previewFile && typeof doc.previewFile === 'string' && doc.previewFile.trim() !== '' && !doc.previewFile.toLowerCase().endsWith('.pdf') && !doc.previewFile.toLowerCase().endsWith('.zip') && !doc.previewFile.toLowerCase().endsWith('.docx') ? doc.previewFile : null);

  return (
    <Card className="overflow-hidden flex flex-col group h-full border-2 border-sand-light bg-warm-cream/70 hover:bg-warm-cream rounded-xl hover:border-forest/60 transition-all duration-300 shadow-xs">
      
      {/* Cover Image/Book container */}
      <Link href={`/documents/${doc.slug}`} className="relative w-full aspect-[4/3] overflow-hidden bg-warm-linen/40 border-b border-sand-light block">
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
      <CardContent className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/documents/${doc.slug}`}>
            <h3 className="font-bold text-sm text-earth line-clamp-2 hover:text-primary transition-colors leading-snug mb-1" title={doc.title}>
              {doc.title}
            </h3>
          </Link>
          <p className="text-[11px] text-muted-foreground italic mt-0.5 line-clamp-1">Tác giả: {doc.author || 'Khuyết danh'}</p>
        </div>
        
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-earth-lighter border-t border-sand-light/60 pt-2">
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {doc.viewCount || 0}</span>
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-gold text-gold" /> 
            <strong className="text-earth-muted">{doc.rating?.average > 0 ? doc.rating.average.toFixed(1) : 'Chưa có'}</strong>
          </span>
          <span className="flex items-center gap-0.5"><Download className="w-3 h-3" /> {doc.purchaseCount || 0}</span>
        </div>
      </CardContent>

      {/* Card Footer pricing */}
      <CardFooter className="p-3 pt-0 border-t border-sand-light/40 bg-warm-cream/40 text-xs">
        <div className="w-full pt-2 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Ấn phí</span>
          <span className={`text-sm font-extrabold tracking-tight ${doc.isFree ? 'text-forest-bright' : 'text-category-red'}`}>
            {formatPrice(doc.price)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function DocumentSuggestions({ documentId }: Props) {
  const { token } = useAuth();
  
  const [related, setRelated] = useState<MarketDocument[]>([]);
  const [suggestions, setSuggestions] = useState<MarketDocument[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    getRelatedDocuments(documentId, 4)
      .then(res => setRelated(res))
      .catch(() => {})
      .finally(() => setLoadingRelated(false));

    getSuggestions(token || undefined, 4)
      .then(res => setSuggestions(res.filter(d => d._id !== documentId)))
      .catch(() => {})
      .finally(() => setLoadingSuggestions(false));
  }, [documentId, token]);

  if (!loadingRelated && related.length === 0 && !loadingSuggestions && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10 py-8 mt-10 border-t border-sand-light">
      
      {/* Related Documents */}
      {(loadingRelated || related.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-5 h-5 text-forest" />
            <h2 className="text-xl font-bold text-earth font-sans">Tài liệu liên quan</h2>
          </div>
          
          {loadingRelated ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary opacity-60" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map(doc => <DocumentCard key={doc._id} doc={doc} />)}
            </div>
          )}
        </section>
      )}

      {/* Suggested Documents */}
      {(loadingSuggestions || suggestions.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-earth font-sans">Có thể bạn sẽ thích</h2>
          </div>
          
          {loadingSuggestions ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary opacity-60" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {suggestions.map(doc => <DocumentCard key={doc._id} doc={doc} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
