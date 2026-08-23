// src/app/page.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Article, Category, MarketDocument } from "@/lib/types";
import { getCategories, getArticles as fetchAllArticles, getDocuments } from "@/lib/api";
import ArticleCard from "@/components/articles/ArticleCard";
import HeroArticleCard from "@/components/articles/HeroArticleCard";
import HeroArticleCarousel from "@/components/articles/HeroArticleCarousel";
import NewspaperArticleCard from "@/components/articles/NewspaperArticleCard";
import TrendingCarousel from "@/components/articles/TrendingCarousel";
import { CompactDocumentCard } from "@/components/documents/CompactDocumentCard";
import { ScrollArea } from "@/components/ui/scroll-area";

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
            <h2 className="font-sans text-3xl font-bold mb-6">{section.name}</h2>
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
            <h2 className="font-sans text-3xl font-bold mb-6">{section.name}</h2>
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
  const [allArticles, categories, documentsRes] = await Promise.all([
    fetchAllArticles({ limit: 24 }).catch(() => [] as Article[]),
    getCategories().catch(() => [] as Category[]),
    getDocuments({ limit: 8, sort: '-createdAt' }).catch(() => ({
      data: [] as MarketDocument[],
      pagination: { total: 0, page: 1, limit: 8, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    })),
  ]);

  // Sort all articles by newest first
  const sortedArticles = [...allArticles].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const featuredArticle = sortedArticles[0];
  const trendingArticles = sortedArticles.filter((a) => a.trending);
  const featuredDocuments = documentsRes.data || [];

  if (sortedArticles.length === 0 && featuredDocuments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Không thể tải được nội dung</h2>
        <p>Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* === HERO: 2-COLUMN SPLIT (LATEST 5 ARTICLES + COMPACT DOCUMENTS) === */}
      {(sortedArticles.length > 0 || featuredDocuments.length > 0) && (
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column (8-9 cols): Bài viết mới nhất (Top 5 Carousel) */}
            {sortedArticles.length > 0 && (
              <div className={`${featuredDocuments.length > 0 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} flex flex-col`}>
                <h2 className="font-sans text-3xl font-bold mb-6">
                  Bài viết mới nhất
                </h2>

                <div className="w-full flex flex-col">
                  <HeroArticleCarousel articles={sortedArticles.slice(0, 5)} />
                </div>
              </div>
            )}

            {/* Right Column (3-4 cols): Kho tài liệu ở góc gọn gàng */}
            {featuredDocuments.length > 0 && (
              <div className={`${sortedArticles.length > 0 ? 'lg:col-span-4 xl:col-span-3' : 'lg:col-span-12'} flex flex-col min-h-0`}>
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="font-sans text-3xl font-bold">
                    Kho tài liệu
                  </h2>
                  <Link
                    href="/documents"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group"
                  >
                    <span>Xem tất cả</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <ScrollArea className="flex-1 w-full max-h-[380px] pr-2">
                  <div className="flex flex-col gap-3 pb-1">
                    {featuredDocuments.map((doc) => (
                      <CompactDocumentCard key={doc._id} doc={doc} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </section>
      )}

      {/* === TRENDING SECTION === */}
      {trendingArticles.length > 0 && (
        <section className="mb-12">
          <h2 className="font-sans text-3xl font-bold mb-6">Xu hướng</h2>
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
