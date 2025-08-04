// src/app/articles/[slug]/related-articles.tsx

import Link from 'next/link';
import type { Article } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --- Hàm gọi API để lấy bài viết cùng chuyên mục ---
async function getCategoryArticles(categorySlug: string, currentArticleSlug: string): Promise<Article[]> {
    if (!categorySlug) return [];
    try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/categories/${categorySlug}/articles`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });
        if (!response.ok) {
            console.error(`[Server] Failed to fetch articles for category ${categorySlug}:`, await response.text());
            return [];
        }
        const articles = await response.json();
        return articles
            .filter((article: Article) => article.slug !== currentArticleSlug)
            .slice(0, 3);
    } catch (error) {
        console.error(`[Server] An error occurred while fetching articles for category ${categorySlug}:`, error);
        return [];
    }
}

// --- Component Bài viết liên quan (Async Server Component) ---
export default async function RelatedArticles({ currentArticleSlug, categorySlug }: { currentArticleSlug: string, categorySlug: string }) {
    const suggestions = await getCategoryArticles(categorySlug, currentArticleSlug);

    if (suggestions.length === 0) {
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
