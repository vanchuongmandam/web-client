import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { Article } from "@/lib/types";

interface NewspaperArticleCardProps {
  article: Article;
}

const NewspaperArticleCard = React.memo(({ article }: NewspaperArticleCardProps) => {
  const imageUrl = article.media?.find(m => m.mediaType === 'image')?.url;
  return (
    <Link href={`/articles/${article.slug}`} className="group">
      <Card className="overflow-hidden h-full transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl"><CardContent className="p-0"><div className="relative aspect-[3/4] w-full bg-muted">{imageUrl && (<Image src={imageUrl} alt={article.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105"/>)}</div><div className="p-3"><h3 className="font-headline text-sm font-semibold leading-tight line-clamp-2">{article.title}</h3><p className="text-xs text-muted-foreground mt-1">{article.author}</p></div></CardContent></Card>
    </Link>
  );
});

NewspaperArticleCard.displayName = "NewspaperArticleCard";

export default NewspaperArticleCard;
