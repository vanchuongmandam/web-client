
export const runtime = 'edge';
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Article } from "@/lib/types";
import type { Metadata } from "next";

// Import the new image gallery component
import { ArticleImageGallery } from "./article-image-gallery";
import { ZenModeToggle } from "@/components/zen-mode-toggle";
import { QuoteCardGenerator } from "@/components/quote-card-generator";

import RichTextEditor from "@/components/ui/rich-text-editor";
import ArticlePdfSection from "./article-pdf-section";
import RelatedArticles from "./related-articles";
import ReadingSuggestions from "./reading-suggestions";
import CommentSection from "./comment-section";

// --- API Function to get a specific article ---
async function getArticle(slug: string): Promise<Article | null> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    // OPTIMIZED: Changed cache strategy to revalidate every hour
    const response = await fetch(`${apiBaseUrl}/articles/${slug}`, { next: { revalidate: 3600 } });
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

// --- generateMetadata for dynamic SEO / OG tags ---
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return {
      title: "Bài viết không tồn tại",
      description: "Bài viết bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
    };
  }

  const url = `https://vanchuongmandam.thptchuyenhatinh.edu.vn/articles/${article.slug}`;
  const image = article.media?.find(m => m.mediaType === "image")?.url || "/default-thumbnail.jpg";

  return {
    title: article.title,
    description: article.excerpt || article.content.slice(0, 150) + "...",
    openGraph: {
      title: article.title,
      description: article.excerpt || article.content.slice(0, 150) + "...",
      url,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || article.content.slice(0, 150) + "...",
      images: [image],
    },
  };
}

// --- Article Detail Page Component (FIXED) ---
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <article className="w-full overflow-hidden break-words">
        <header className="mb-8 w-full">
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
            <Badge variant="secondary">{article.category.name}</Badge>
            <span>{article.date}</span>
            <div className="ml-auto flex items-center gap-2">
              <QuoteCardGenerator initialText={article.title} author={article.author} />
              <ZenModeToggle />
            </div>
          </div>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight text-primary break-words hyphens-auto">
            {article.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground break-words">
            Bởi <span className="font-semibold text-foreground">{article.author}</span>
          </p>
        </header>

        {/* --- New Image Gallery Section --- */}
        {article.media && article.media.length > 0 && article.media.some(m => m.mediaType === "image" || m.mediaType === "video") && (
          <div className="mb-8 w-full overflow-hidden">
            <ArticleImageGallery
              media={article.media}
              articleId={article._id}
              articleTitle={article.title}
            />
          </div>
        )}

        {/* --- PDF Section --- */}
        {article.media && article.media.some(m => m.mediaType === "pdf") && (
          <ArticlePdfSection pdfs={article.media.filter(m => m.mediaType === "pdf")} />
        )}

        <RichTextEditor
          content={article.content}
          editable={false}
          className="w-full overflow-hidden"
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
