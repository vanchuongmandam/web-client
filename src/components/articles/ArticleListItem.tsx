import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/types";
import { formatVietnameseDate, getMediaUrl } from "@/lib/utils";

interface ArticleListItemProps {
  article: Article;
}

const ArticleListItem = React.memo(({ article }: ArticleListItemProps) => {
  const rawImageUrl = article.media?.find(m => m.mediaType === 'image')?.url;
  const imageUrl = getMediaUrl(rawImageUrl);
  return (
    <Card className="group grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-sm active:scale-[0.98] hover:border-primary/50">
      <div className="relative col-span-1 aspect-video sm:aspect-auto sm:h-full sm:min-h-[150px] bg-muted overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-warm-cream bg-[url('/patterns/cardboard-flat.png')] bg-repeat border-b sm:border-b-0 sm:border-r border-sand">
            <h3 className="font-sans text-sm font-medium leading-tight line-clamp-3 text-earth">
              {article.title}
            </h3>
          </div>
        )}
      </div>
      <div className="col-span-2 p-4">
        <Badge variant="outline" className="mb-2 rounded-full">{article.category.name}</Badge>
        <h3 className="font-sans text-lg font-bold leading-tight">
          <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">{article.title}</Link>
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{article.excerpt}</p>
        <p className="text-xs text-muted-foreground mt-2">{article.author} &bull; {formatVietnameseDate(article.date)}</p>
      </div>
    </Card>
  );
});

ArticleListItem.displayName = "ArticleListItem";

export default ArticleListItem;
