"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/types";
import { formatVietnameseDate, getMediaUrl, cn } from "@/lib/utils";

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
      <Card
        className={cn(
          "relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[280px] max-h-[380px] overflow-hidden rounded-xl shadow-xs transition-all duration-300 flex flex-col justify-end",
          showBanner
            ? "border border-sand bg-warm-cream hover:border-primary/50 hover:shadow-sm"
            : "border border-sand-light/80 bg-wine-deepest hover:border-primary/60 hover:shadow-sm"
        )}
      >
        {/* Background Image / Parchment Banner (ArticleCard style) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {!showBanner ? (
            <>
              <Image
                src={initialImageUrl!}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                priority
                onError={() => setImageError(true)}
              />
              {/* Vignette & Gradient Overlays for Image Only */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-black/10 z-10" />
            </>
          ) : (
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-300 group-hover:scale-105"
              style={{
                backgroundColor: '#fdfbf7',
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard-flat.png")',
                color: '#4a4a4a',
                borderBottom: '1px solid #e6e1d5'
              }}
            />
          )}
        </div>

        {/* Category Badge at Top Left */}
        {article.category?.name && (
          <div className="absolute top-3.5 left-3.5 z-20">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full shadow-xs px-3 py-0.5 font-semibold text-xs tracking-wide",
                showBanner
                  ? "bg-warm-sand text-primary border-sand"
                  : "bg-warm-cream text-primary border-sand/80"
              )}
            >
              {article.category.name}
            </Badge>
          </div>
        )}

        {/* Editorial Text Overlay at Bottom (Always shown: Title, Excerpt, Author/Date) */}
        <div className="relative z-20 p-4 sm:p-5 md:p-6 flex flex-col justify-end">
          <h3
            className={cn(
              "font-sans text-lg sm:text-xl md:text-2xl font-bold leading-tight sm:leading-snug transition-colors duration-200 line-clamp-2 mb-1.5 sm:mb-2",
              showBanner
                ? "text-foreground group-hover:text-primary"
                : "text-warm-cream group-hover:text-gold"
            )}
          >
            {article.title}
          </h3>

          {article.excerpt && (
            <p
              className={cn(
                "text-xs sm:text-sm line-clamp-2 leading-relaxed mb-2 sm:mb-2.5 font-normal",
                showBanner ? "text-earth-muted" : "text-warm-sand/90"
              )}
            >
              {article.excerpt}
            </p>
          )}

          <div
            className={cn(
              "flex items-center gap-2 text-[11px] sm:text-xs font-medium pt-1.5 border-t",
              showBanner
                ? "text-earth-muted border-sand"
                : "text-warm-sand/80 border-white/15"
            )}
          >
            <span
              className={cn(
                "font-semibold",
                showBanner ? "text-foreground" : "text-warm-cream"
              )}
            >
              {article.author || "Văn Chương Mạn Đàm"}
            </span>
            <span className={showBanner ? "text-sand-dark" : "text-warm-sand/50"}>•</span>
            <span>{formatVietnameseDate(article.date)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
