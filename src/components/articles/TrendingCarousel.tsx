"use client";

import { useRef } from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ArticleCard from "@/components/articles/ArticleCard";
import type { Article } from "@/lib/types";

export default function TrendingCarousel({ articles }: { articles: Article[] }) {
  // Use Embla AutoScroll plugin to achieve the marquee effect
  const plugin = useRef(
    AutoScroll({
      playOnInit: true,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      speed: 5
    })
  );

  return (
    <Carousel
      opts={{ loop: true, align: "start" }}
      plugins={[plugin.current]}
      className="relative w-full cursor-grab active:cursor-grabbing "
    >
      <CarouselContent className="-ml-4 py-4">
        {articles.map((article) => (
          <CarouselItem
            key={article.slug}
            className="pl-4 basis-[80vw] sm:basis-[300px] md:basis-[350px] lg:basis-[400px] shrink-0"
          >
            <ArticleCard article={article} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
