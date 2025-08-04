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
    // Sử dụng cache 'no-store' để đảm bảo luôn lấy dữ liệu mới nhất
    // Quan trọng cho các bài viết có thể được cập nhật thường xuyên
    const response = await fetch(`${apiBaseUrl}/articles/${slug}`, { cache: 'no-store' });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Trả về null nếu API báo không tìm thấy
      }
      // Ném lỗi cho các trường hợp lỗi khác (500, etc.)
      throw new Error(`Failed to fetch article: ${response.statusText}`);
    }
    
    const articleData = await response.json();
    // API của bạn trả về category là một object, cần phải trích xuất 'name'
    return {
      ...articleData,
      category: articleData.category.name,
    };

  } catch (error) {
    console.error(`An error occurred while fetching article ${slug}:`, error);
    // Trả về null để component cha có thể xử lý notFound()
    return null;
  }
}

// --- Component trang chi tiết bài viết (chuyển thành async) ---
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  // Nếu không tìm thấy bài viết, hiển thị trang 404
  if (!article) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <article>
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <Badge variant="secondary">{article.category}</Badge>
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

        {/* 
          Sử dụng dangerouslySetInnerHTML để render nội dung HTML từ API.
          Điều này an toàn khi bạn tin tưởng nguồn dữ liệu (backend của bạn).
          Nó cho phép hiển thị định dạng phức tạp như bold, italic, links...
        */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none prose-p:font-body prose-headings:font-headline"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      <Separator className="my-12" />

      {/* Truyền category và slug hiện tại để ReadingSuggestions có thể fetch dữ liệu liên quan */}
      <ReadingSuggestions currentArticleSlug={article.slug} category={article.category} />
    </div>
  );
}
