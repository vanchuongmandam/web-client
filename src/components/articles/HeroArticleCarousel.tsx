"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import HeroArticleCard from "./HeroArticleCard";
import type { Article } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroArticleCarouselProps {
  articles: Article[];
}

export default function HeroArticleCarousel({ articles }: HeroArticleCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const displayArticles = articles.slice(0, 5);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Auto-advance slide every 6 seconds
  useEffect(() => {
    if (!api || displayArticles.length <= 1) return;

    const timer = setInterval(() => {
      api.scrollNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [api, displayArticles.length]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  if (displayArticles.length === 0) return null;

  if (displayArticles.length === 1) {
    return <HeroArticleCard article={displayArticles[0]} />;
  }

  return (
    <div className="relative w-full group/carousel">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {displayArticles.map((article, idx) => (
            <CarouselItem key={article.slug || idx} className="pl-0 basis-full">
              <HeroArticleCard article={article} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Navigation Arrows (visible on hover) */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label="Bài viết trước"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-warm-cream flex items-center justify-center backdrop-blur-xs border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 cursor-pointer shadow-xs"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={scrollNext}
        aria-label="Bài viết tiếp theo"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-warm-cream flex items-center justify-center backdrop-blur-xs border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 cursor-pointer shadow-xs"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Slide Indicator Dots (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
        {displayArticles.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => scrollTo(idx)}
            aria-label={`Chuyển đến bài ${idx + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
              current === idx
                ? "w-5 bg-warm-cream"
                : "w-1.5 bg-warm-cream/40 hover:bg-warm-cream/70"
            )}
          />
        ))}
      </div>
    </div>
  );
}
