import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/types";
import { formatVietnameseDate } from "@/lib/utils";

interface ArticleCardProps {
  article: Article;
}

const ArticleCard = React.memo(({ article }: ArticleCardProps) => {
  const imageUrl = article.media?.find(m => m.mediaType === 'image')?.url;
  return (
    <Card className="h-full flex flex-col overflow-hidden group transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl"><CardHeader className="p-0"><div className="relative aspect-video w-full bg-muted">{imageUrl && (<Image src={imageUrl} alt={article.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />)}</div></CardHeader><CardContent className="p-4 flex-grow"><Badge variant="outline" className="mb-2">{article.category.name}</Badge><CardTitle className="font-headline text-xl leading-tight mb-2"><Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">{article.title}</Link></CardTitle><p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p></CardContent><CardFooter className="p-4 pt-0"><p className="text-xs text-muted-foreground">{article.author} &bull; {formatVietnameseDate(article.date)}</p></CardFooter></Card>
  );
});

ArticleCard.displayName = "ArticleCard";

export default ArticleCard;
