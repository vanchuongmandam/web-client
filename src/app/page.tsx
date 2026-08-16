// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import type { Article, Category } from "@/lib/types";
import { getCategories, getArticles as fetchAllArticles } from "@/lib/api";
import ArticleCard from "@/components/articles/ArticleCard";
import NewspaperArticleCard from "@/components/articles/NewspaperArticleCard";
import TrendingCarousel from "@/components/articles/TrendingCarousel";
import { FeaturedImageFallback } from "@/components/articles/FeaturedImageFallback";

function CategorySectionsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-pulse">
      <div className="lg:col-span-2 space-y-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <div className="h-8 w-48 bg-muted rounded mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-64 bg-muted rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="h-8 w-32 bg-muted rounded mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

function groupArticlesByCategory(
  articles: Article[],
  slugs: string[],
  categories: Category[],
): { slug: string; name: string; articles: Article[] }[] {
  return slugs.map((slug) => {
    const category = categories.find((cat) => cat.slug === slug);
    if (!category) return { slug, name: slug, articles: [] };

    // Collect this category's ID + all descendant IDs
    const categoryIds = new Set<string>();
    const collectIds = (cat: Category) => {
      categoryIds.add(cat._id);
      cat.children?.forEach(collectIds);
    };
    collectIds(category);

    const filtered = articles.filter((a) =>
      categoryIds.has(typeof a.category === 'object' ? a.category._id : a.category as unknown as string)
    );

    // Sort by newest first
    filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { slug, name: category.name, articles: filtered };
  });
}

async function CategorySections({
  categories,
  allArticles,
}: {
  categories: Category[];
  allArticles: Article[];
}) {
  const leftColumnSlugs = [
    'danh-cho-chuyen-van',
    'van-chuong-hoc-va-thi',
    'van-chuong-thu-vi',
    'dien-dan-van-chuong',
  ];
  const rightColumnSlugs = ['goc-sang-tac'];

  const leftColumnSections = groupArticlesByCategory(allArticles, leftColumnSlugs, categories);
  const rightColumnSections = groupArticlesByCategory(allArticles, rightColumnSlugs, categories);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-12">
        {leftColumnSections.map((section) => section.articles.length > 0 && (
          <section key={section.slug}>
            <h2 className="font-headline text-3xl font-bold mb-6">{section.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {section.articles.slice(0, 4).map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <aside>
        {rightColumnSections.map((section) => section.articles.length > 0 && (
          <section key={section.slug} className="sticky top-8">
            <h2 className="font-headline text-3xl font-bold mb-6">{section.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              {section.articles.slice(0, 4).map((article) => (
                <NewspaperArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        ))}
      </aside>
    </div>
  );
}

export default async function Home() {
  const [allArticles, categories] = await Promise.all([
    fetchAllArticles({ limit: 100 }).catch(() => [] as Article[]),
    getCategories().catch(() => [] as Category[]),
  ]);

  // Sort all articles by newest first
  const sortedArticles = [...allArticles].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const featuredArticle = sortedArticles[0];
  const trendingArticles = sortedArticles.filter(a => a.trending);

  const featuredImage = featuredArticle?.media?.find(m => m.mediaType === 'image')?.url;

  if (sortedArticles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Không thể tải được bài viết</h2>
        <p>Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* === HERO SECTION === */}
      {featuredArticle && (
        <section className="mb-12">
          <Card className="grid md:grid-cols-2 overflow-hidden border-2 border-primary/20 rounded-xl shadow-xs">
            <FeaturedImageFallback 
              initialImageUrl={featuredImage} 
              title={featuredArticle.title} 
              priority 
            />
            <div className="p-8 flex flex-col justify-center">
              <Badge variant="secondary" className="mb-2 w-fit rounded-full">{featuredArticle.category.name}</Badge>
              <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-primary">
                <Link href={`/articles/${featuredArticle.slug}`} className="hover:underline">{featuredArticle.title}</Link>
              </h1>
              <p className="text-muted-foreground mb-4">{featuredArticle.author}</p>
              <p className="mb-6">{featuredArticle.excerpt}</p>
              <Button asChild className="w-fit rounded-md" variant="accent">
                <Link href={`/articles/${featuredArticle.slug}`}>Đọc tiếp <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* === TRENDING SECTION (Full-width, above the grid) === */}
      {trendingArticles.length > 0 && (
        <section className="mb-12">
          <h2 className="font-headline text-3xl font-bold mb-6">Xu hướng</h2>
          <TrendingCarousel articles={trendingArticles} />
        </section>
      )}

      {/* === MAIN TWO-COLUMN LAYOUT === */}
      <Suspense fallback={<CategorySectionsSkeleton />}>
        <CategorySections categories={categories} allArticles={sortedArticles} />
      </Suspense>
    </div>
  );
}
