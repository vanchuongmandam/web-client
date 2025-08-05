// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/types";


async function getArticles(): Promise<Article[]> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/articles`, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error("Failed to fetch articles:", await response.text());
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error("An error occurred while fetching articles:", error);
    return [];
  }
}

export default async function Home() {
  const articles = await getArticles();

  if (articles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Không thể tải được bài viết</h2>
        <p>Vui lòng thử lại sau.</p>
      </div>
    );
  }

  // --- Data filter ---
  const featuredArticle = articles[0];
  const trendingArticles = articles.filter(a => a.trending);
  const criticismArticles = articles.filter(a => a.category.name === 'Phê bình & Tiểu luận').slice(0, 4);
  const creativeWritingArticles = articles.filter(a => a.category.name === 'Sáng tác').slice(0, 3);
  const newspaperArticles = articles.filter(a => a.category.slug === 'bai-bao').slice(0, 4);
  const featuredImage = featuredArticle?.media?.find(m => m.mediaType === 'image')?.url;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* === HERO SECTION === */}
      {featuredArticle && (
        <section className="mb-12">
           <Card className="grid md:grid-cols-2 overflow-hidden border-2 border-primary/20 shadow-xl"><div className="relative h-64 md:h-auto bg-muted">{featuredImage && (<Image src={featuredImage} alt={featuredArticle.title} fill className="object-cover" priority/>)}</div><div className="p-8 flex flex-col justify-center"><Badge variant="secondary" className="mb-2 w-fit">{featuredArticle.category.name}</Badge><h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-primary"><Link href={`/articles/${featuredArticle.slug}`} className="hover:underline">{featuredArticle.title}</Link></h1><p className="text-muted-foreground mb-4">{featuredArticle.author}</p><p className="mb-6">{featuredArticle.excerpt}</p><Button asChild className="w-fit" variant="accent"><Link href={`/articles/${featuredArticle.slug}`}>Đọc tiếp <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></Card>
        </section>
      )}

      {/* === TRENDING SECTION (Full-width, above the grid) === */}
      {trendingArticles.length > 0 && (
        <section className="mb-12">
          <h2 className="font-headline text-3xl font-bold mb-6">Xu hướng</h2>
          <Carousel opts={{ loop: trendingArticles.length > 1 }} className="w-full">
            <CarouselContent className="-ml-4">
              {trendingArticles.map((article) => (
                <CarouselItem key={article.slug} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <ArticleCard article={article} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </section>
      )}

      {/* === MAIN TWO-COLUMN LAYOUT STARTS HERE === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* === LEFT COLUMN (MAIN CONTENT) === */}
        <div className="lg:col-span-2 space-y-12">
          {/* Criticism Section */}
          {criticismArticles.length > 0 && (
            <section>
              <h2 className="font-headline text-3xl font-bold mb-6">Phê bình & Tiểu luận</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {criticismArticles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          )}

          {/* Creative Writing Section */}
          {creativeWritingArticles.length > 0 && (
            <section>
              <h2 className="font-headline text-3xl font-bold mb-6">Sáng tác</h2>
              <div className="space-y-6">
                {creativeWritingArticles.map((article) => (
                  <ArticleListItem key={article.slug} article={article} />
                ))}
              </div>
            </section>
           )}
        </div>

        {/* === RIGHT COLUMN (STICKY SIDEBAR) === */}
        <aside>
          {newspaperArticles.length > 0 && (
            <section className="sticky top-8">
              <h2 className="font-headline text-3xl font-bold mb-6">Bài báo</h2>
              <div className="grid grid-cols-2 gap-4">
                {newspaperArticles.map((article) => (
                  <NewspaperArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

const NewspaperArticleCard = ({ article }: { article: Article }) => {
  const imageUrl = article.media?.find(m => m.mediaType === 'image')?.url;
  return (
    <Link href={`/articles/${article.slug}`} className="group">
      <Card className="overflow-hidden h-full transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl"><CardContent className="p-0"><div className="relative aspect-[3/4] w-full bg-muted">{imageUrl && (<Image src={imageUrl} alt={article.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105"/>)}</div><div className="p-3"><h3 className="font-headline text-sm font-semibold leading-tight line-clamp-2">{article.title}</h3><p className="text-xs text-muted-foreground mt-1">{article.author}</p></div></CardContent></Card>
    </Link>
  );
};
const ArticleCard = ({ article }: { article: Article }) => {
  const imageUrl = article.media?.find(m => m.mediaType === 'image')?.url;
  return (
    <Card className="h-full flex flex-col overflow-hidden group transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl"><CardHeader className="p-0"><div className="relative aspect-video w-full bg-muted">{imageUrl && (<Image src={imageUrl} alt={article.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105"/>)}</div></CardHeader><CardContent className="p-4 flex-grow"><Badge variant="outline" className="mb-2">{article.category.name}</Badge><CardTitle className="font-headline text-xl leading-tight mb-2"><Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">{article.title}</Link></CardTitle><p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p></CardContent><CardFooter className="p-4 pt-0"><p className="text-xs text-muted-foreground">{article.author} &bull; {article.date}</p></CardFooter></Card>
  );
};
const ArticleListItem = ({ article }: { article: Article }) => {
    const imageUrl = article.media?.find(m => m.mediaType === 'image')?.url;
    return (
        <Card className="group grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl"><div className="relative col-span-1 h-full min-h-[150px] bg-muted">{imageUrl && (<Image src={imageUrl} alt={article.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105"/>)}</div><div className="col-span-2 p-4"><Badge variant="outline" className="mb-2">{article.category.name}</Badge><h3 className="font-headline text-lg font-bold leading-tight"><Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">{article.title}</Link></h3><p className="text-sm text-muted-foreground mt-1 line-clamp-3">{article.excerpt}</p><p className="text-xs text-muted-foreground mt-2">{article.author} &bull; {article.date}</p></div></Card>
    );
};
