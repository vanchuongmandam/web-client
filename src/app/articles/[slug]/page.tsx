// src/app/articles/[slug]/page.tsx
export const runtime = 'edge';
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Article } from "@/lib/types";

import RelatedArticles from "./related-articles";
import ReadingSuggestions from "./reading-suggestions";
import CommentSection from "./comment-section";

// --- Hàm gọi API để lấy một bài viết cụ thể ---
async function getArticle(slug: string): Promise<Article | null> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/articles/${slug}`, { cache: 'no-store' });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch article: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`An error occurred while fetching article ${slug}:`, error);
    return null;
  }
}

// --- Component trang chi tiết bài viết (Đã sửa) ---
// Sửa trực tiếp ở chữ ký của hàm để lấy slug ra ngay lập tức
export default async function ArticlePage({ params: { slug } }: { params: { slug: string } }) {
  // Bây giờ 'slug' đã có sẵn, không cần dòng const { slug } = params; nữa
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }
  
  const heroImage = article.media?.find(m => m.mediaType === 'image')?.url;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <article>
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <Badge variant="secondary">{article.category.name}</Badge>
            <span>{article.date}</span>
          </div>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
            {article.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Bởi <span className="font-semibold text-foreground">{article.author}</span>
          </p>
        </header>

        {heroImage && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-8">
                <Image
                    src={heroImage}
                    alt={article.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                />
            </div>
        )}
        
        <div
          className="prose prose-lg dark:prose-invert max-w-none prose-p:font-body prose-headings:font-headline"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      <Separator className="my-12" />
      
      <RelatedArticles 
        currentArticleSlug={article.slug} 
        categorySlug={article.category.slug} 
      />

      <div className="mt-12">
        <ReadingSuggestions 
          articleContent={article.content} 
        />
      </div>

      <Separator className="my-12" />
      <CommentSection articleId={article._id} />

    </div>
  );
}
