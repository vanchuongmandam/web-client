"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/types";
import { formatVietnameseDate, getMediaUrl } from "@/lib/utils";

interface ArticleCardProps {
  article: Article;
}

const ArticleCard = React.memo(({ article }: ArticleCardProps) => {
  const rawImageUrl = article.media?.find(m => m.mediaType === 'image')?.url;
  const initialImageUrl = getMediaUrl(rawImageUrl);
  const [imageError, setImageError] = useState(false);

  const showBanner = !initialImageUrl || imageError;

  return (
    <Card className="h-full flex flex-col overflow-hidden rounded-xl group transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-sm border border-border bg-card shadow-xs hover:border-primary/50">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
          {!showBanner ? (
            <Image
              src={initialImageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-warm-cream bg-[url('/patterns/cardboard-flat.png')] bg-repeat border-b border-sand transition-transform duration-300 group-hover:scale-105">
              <h3 className="font-sans text-lg md:text-xl font-medium leading-snug line-clamp-3 text-earth">
                {article.title}
              </h3>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Badge variant="secondary" className="mb-2 rounded-full">{article.category.name}</Badge>
        <CardTitle className="font-sans text-xl leading-tight mb-2">
          <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">{article.title}</Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-xs text-muted-foreground">{article.author} &bull; {formatVietnameseDate(article.date)}</p>
      </CardFooter>
    </Card>
  );
});

ArticleCard.displayName = "ArticleCard";

export default ArticleCard;

