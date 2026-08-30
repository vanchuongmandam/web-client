"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { Article } from "@/lib/types";
import { getMediaUrl } from "@/lib/utils";

interface NewspaperArticleCardProps {
  article: Article;
}

const NewspaperArticleCard = React.memo(({ article }: NewspaperArticleCardProps) => {
  const rawImageUrl = article.media?.find(m => m.mediaType === 'image')?.url;
  const initialImageUrl = getMediaUrl(rawImageUrl);
  const [imageError, setImageError] = useState(false);
  
  const showBanner = !initialImageUrl || imageError;

  return (
    <Link href={`/articles/${article.slug}`} className="group">
      <Card className="overflow-hidden rounded-xl h-full transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-sm active:scale-[0.98] border border-border bg-card shadow-xs hover:border-primary/50">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
            {!showBanner ? (
              <Image
                src={initialImageUrl!}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-warm-cream bg-[url('/patterns/cardboard-flat.png')] bg-repeat border-b border-sand transition-transform duration-300 group-hover:scale-105">
                <h3 className="font-sans text-sm font-medium leading-tight line-clamp-4 text-earth">
                  {article.title}
                </h3>
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-sans text-sm font-semibold leading-tight line-clamp-2">{article.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{article.author}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

NewspaperArticleCard.displayName = "NewspaperArticleCard";

export default NewspaperArticleCard;


