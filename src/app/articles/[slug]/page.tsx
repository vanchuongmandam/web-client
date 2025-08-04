// src/app/articles/[slug]/page.tsx

import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ReadingSuggestions from "./reading-suggestions";
import type { Article } from "@/lib/types";

// --- Hàm gọi API để lấy một bài viết cụ thể ---
async function getArticle(slug: string): Promise<Article | null> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/articles/${slug}`, { cache: 'no-store' });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch article: ${response.statusText}`);
    }
    
    // Giữ nguyên object category từ API, không làm phẳng nó nữa
    const articleData = await response.json();
    return articleData;

  } catch (error) {
    console.error(`An error occurred while fetching article ${slug}:`, error);
    return null;
  }
}

// --- Component trang chi tiết bài viết (chuyển thành async) ---
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <article>
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            {/* Hiển thị tên category */}
            <Badge variant="secondary">{article.category.name}</Badge>
            <span>{new Date(article.date).toLocaleDateString('vi-VN')}</span>
          </div>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
            {article.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Bởi <span className="font-semibold text-foreground">{article.author}</span>
          </p>
        </header>

        <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-8">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        
        <div
          className="prose prose-lg dark:prose-invert max-w-none prose-p:font-body prose-headings:font-headline"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      <Separator className="my-12" />

      {/* 
        Truyền category SLUG (đúng từ API) và slug bài viết hiện tại
        xuống component ReadingSuggestions
      */}
      <ReadingSuggestions 
        currentArticleSlug={article.slug} 
        categorySlug={article.category.slug} 
      />
    </div>
  );
}
