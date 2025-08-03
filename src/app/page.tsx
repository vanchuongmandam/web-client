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
import { ArrowRight, BookOpen, Feather } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { articles, books } from "@/lib/mock-data";
import type { Article } from "@/lib/types";

const featuredArticle = articles.find(a => a.id === '1')!;
const trendingArticles = articles.filter(a => a.trending);
const criticismArticles = articles.filter(a => a.category === 'Phê bình & Tiểu luận').slice(0, 4);
const creativeWritingArticles = articles.filter(a => a.category === 'Sáng tác').slice(0, 3);
const recommendedBooks = books.slice(0, 4);

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <Card className="grid md:grid-cols-2 overflow-hidden border-2 border-primary/20 shadow-xl">
          <div className="relative h-64 md:h-auto">
            <Image
              src={featuredArticle.imageUrl}
              alt={featuredArticle.title}
              fill
              className="object-cover"
              data-ai-hint={featuredArticle.imageHint}
              priority
            />
          </div>
          <div className="p-8 flex flex-col justify-center">
            <Badge variant="secondary" className="mb-2 w-fit">{featuredArticle.category}</Badge>
            <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-primary">
              <Link href={`/articles/${featuredArticle.slug}`} className="hover:underline">
                {featuredArticle.title}
              </Link>
            </h1>
            <p className="text-muted-foreground mb-4">{featuredArticle.author}</p>
            <p className="mb-6">{featuredArticle.excerpt}</p>
            <Button asChild className="w-fit" variant="accent">
              <Link href={`/articles/${featuredArticle.slug}`}>
                Đọc tiếp <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Trending Section */}
      <section className="mb-12">
        <h2 className="font-headline text-3xl font-bold mb-6">Xu hướng</h2>
        <Carousel opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {trendingArticles.map((article) => (
              <CarouselItem key={article.id} className="md:basis-1/2 lg:basis-1/3">
                <ArticleCard article={article} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Criticism Section */}
          <section className="mb-12">
            <h2 className="font-headline text-3xl font-bold mb-6">Phê bình & Tiểu luận</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {criticismArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>

          {/* Creative Writing Section */}
          <section className="mb-12">
            <h2 className="font-headline text-3xl font-bold mb-6">Sáng tác</h2>
            <div className="space-y-6">
              {creativeWritingArticles.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))}
            </div>
          </section>
        </div>

        <aside>
          {/* Books Section */}
          <section className="mb-12 sticky top-8">
            <h2 className="font-headline text-3xl font-bold mb-6">Sách hay</h2>
            <div className="grid grid-cols-2 gap-4">
              {recommendedBooks.map((book) => (
                <Link href="#" key={book.id} className="group">
                  <Card className="overflow-hidden h-full transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl">
                    <CardContent className="p-0">
                      <div className="relative aspect-[2/3] w-full">
                        <Image
                          src={book.imageUrl}
                          alt={book.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint={book.imageHint}
                        />
                      </div>
                      <div className="p-3">
                         <h3 className="font-headline text-sm font-semibold leading-tight">{book.title}</h3>
                         <p className="text-xs text-muted-foreground">{book.author}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

const ArticleCard = ({ article }: { article: Article }) => (
  <Card className="h-full flex flex-col overflow-hidden group transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl">
    <CardHeader className="p-0">
       <div className="relative aspect-video w-full">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={article.imageHint}
        />
      </div>
    </CardHeader>
    <CardContent className="p-4 flex-grow">
      <Badge variant="outline" className="mb-2">{article.category}</Badge>
      <CardTitle className="font-headline text-xl leading-tight mb-2">
        <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">
          {article.title}
        </Link>
      </CardTitle>
      <p className="text-sm text-muted-foreground">{article.excerpt}</p>
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <p className="text-xs text-muted-foreground">{article.author} &bull; {article.date}</p>
    </CardFooter>
  </Card>
);

const ArticleListItem = ({ article }: { article: Article }) => (
    <Card className="group grid grid-cols-3 gap-4 overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl">
      <div className="relative col-span-1 h-full min-h-[120px]">
          <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={article.imageHint}
          />
      </div>
      <div className="col-span-2 p-4">
          <Badge variant="outline" className="mb-2">{article.category}</Badge>
          <h3 className="font-headline text-lg font-bold leading-tight">
              <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">
                  {article.title}
              </Link>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{article.excerpt}</p>
          <p className="text-xs text-muted-foreground mt-2">{article.author} &bull; {article.date}</p>
      </div>
  </Card>
);
