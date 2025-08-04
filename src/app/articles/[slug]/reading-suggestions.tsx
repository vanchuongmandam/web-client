// src/app/articles/[slug]/reading-suggestions.tsx

import Link from 'next/link';
import type { Article } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText } from 'lucide-react';

// Helper function to convert a category name to a slug
const toSlug = (name: string) => {
    return name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
};

// --- Hàm gọi API để lấy bài viết cùng chuyên mục ---
async function getCategoryArticles(category: string, currentArticleSlug: string): Promise<Article[]> {
    try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const categorySlug = toSlug(category);
        const response = await fetch(`${apiBaseUrl}/categories/${categorySlug}/articles`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            console.error(`Failed to fetch articles for category ${categorySlug}:`, await response.text());
            return [];
        }

        const articles = await response.json();
        
        // Lọc bài viết hiện tại ra khỏi danh sách gợi ý và chỉ lấy 3 bài đầu tiên
        return articles
            .filter((article: Article) => article.slug !== currentArticleSlug)
            .slice(0, 3);

    } catch (error) {
        console.error(`An error occurred while fetching articles for category ${category}:`, error);
        return [];
    }
}


// --- Component Gợi ý đọc thêm (Async Server Component) ---
export default async function ReadingSuggestions({ currentArticleSlug, category }: { currentArticleSlug: string, category: string }) {
    const suggestions = await getCategoryArticles(category, currentArticleSlug);

    if (suggestions.length === 0) {
        // Nếu không có bài viết nào khác trong cùng danh mục, không hiển thị gì cả.
        return null;
    }

    return (
        <section>
            <h2 className="font-headline text-3xl font-bold mb-6">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((article) => (
                    <Link key={article.slug} href={`/articles/${article.slug}`} className="group">
                        <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl">
                            <CardHeader>
                                <CardTitle className="font-headline text-lg leading-tight group-hover:text-primary transition-colors">
                                    {article.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {article.excerpt}
                                </p>
                                <p className="text-xs text-muted-foreground mt-4">{article.author}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
