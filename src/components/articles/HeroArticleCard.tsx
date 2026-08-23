"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/types";
import { formatVietnameseDate, getMediaUrl } from "@/lib/utils";

interface HeroArticleCardProps {
  article: Article;
}

export default function HeroArticleCard({ article }: HeroArticleCardProps) {
  const rawImageUrl = article.media?.find((m) => m.mediaType === "image")?.url;
  const initialImageUrl = getMediaUrl(rawImageUrl);
  const [imageError, setImageError] = useState(false);

  const showBanner = !initialImageUrl || imageError;

  return (
    <Link href={`/articles/${article.slug}`} className="block w-full group">
      <Card className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[280px] max-h-[380px] overflow-hidden rounded-xl border border-sand-light/80 bg-wine-deepest shadow-xs transition-all duration-300 hover:border-primary/60 hover:shadow-sm flex flex-col justify-end">
        {/* Background Image / Fallback */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-wine-deepest">
          {!showBanner ? (
            <Image
              src={initialImageUrl!}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-wine-deepest via-earth-dark to-wine-night flex items-center justify-center p-6 text-center">
              <div className="border border-sand/20 rounded-lg p-4 max-w-md w-full">
                <span className="text-[11px] uppercase tracking-widest text-gold/80 font-semibold block mb-1">
                  {article.category?.name || "VĂN CHƯƠNG MẠN ĐÀM"}
                </span>
                <span className="text-warm-sand/40 text-lg block select-none font-sans">
                  ❖
                </span>
              </div>
            </div>
          )}

          {/* Vignette & Gradient Overlays for High Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-black/10 z-10" />
        </div>

        {/* Category Badge at Top Left */}
        {article.category?.name && (
          <div className="absolute top-3.5 left-3.5 z-20">
            <Badge
              variant="outline"
              className="rounded-full bg-warm-cream text-primary border-sand/80 shadow-xs px-3 py-0.5 font-semibold text-xs tracking-wide"
            >
              {article.category.name}
            </Badge>
          </div>
        )}

        {/* Editorial Text Overlay at Bottom */}
        <div className="relative z-20 p-4 sm:p-5 md:p-6 flex flex-col justify-end">
          <h3 className="font-sans text-lg sm:text-xl md:text-2xl font-bold leading-tight sm:leading-snug text-warm-cream group-hover:text-gold transition-colors duration-200 line-clamp-2 mb-1.5 sm:mb-2">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="text-xs sm:text-sm text-warm-sand/90 line-clamp-2 leading-relaxed mb-2 sm:mb-2.5 font-normal">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-warm-sand/80 font-medium pt-1.5 border-t border-white/15">
            <span className="font-semibold text-warm-cream">
              {article.author || "Văn Chương Mạn Đàm"}
            </span>
            <span className="text-warm-sand/50">•</span>
            <span>{formatVietnameseDate(article.date)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
