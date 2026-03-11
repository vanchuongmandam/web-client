
"use client";

import { useState, useEffect, useMemo, Suspense, Fragment, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Article, Category, PaginationMeta } from '@/lib/types';
import { getArticlesPaginated, getArticlesByCategoryPaginated } from '@/lib/api';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { findCategoryBySlug, findCategoryWithParent, formatVietnameseDate } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination-controls';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';

async function fetchCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Không thể tải danh sách danh mục.");
    const json = await res.json();
    return json.data ?? json;
}

const SORT_MAP: Record<string, string> = {
    newest: '-createdAt',
    oldest: 'createdAt',
    'a-z': 'title',
};

// --- Sub-components ---
const ArticleCard = ({ article }: { article: Article }) => (
    <Card className="h-full flex flex-col overflow-hidden group transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl">
        <div className="p-0">
            <div className="relative aspect-video w-full bg-muted">
                {article.media?.[0]?.url ? (
                    <Image
                        src={article.media[0].url}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : <div className="h-full w-full bg-secondary"></div>}
            </div>
        </div>
        <CardContent className="p-4 flex-grow">
            <Badge variant="outline" className="mb-2">{article.category?.name}</Badge>
            <CardTitle className="font-headline text-xl leading-tight mb-2">
                <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">{article.title}</Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">{article.author} &bull; {formatVietnameseDate(article.date)}</p>
        </CardFooter>
    </Card>
);

const CategoryOptions = ({ categories }: { categories: Category[] }) => (
    <>
        {categories.map(category => (
            <Fragment key={category._id}>
                {category.children && category.children.length > 0 ? (
                    <SelectGroup>
                        <SelectLabel>{category.name}</SelectLabel>
                        <SelectItem value={category.slug}>Tất cả</SelectItem>
                        {category.children.map(child => (
                            <SelectItem key={child._id} value={child.slug}>
                                {child.name}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ) : (
                    <SelectItem value={category.slug}>{category.name}</SelectItem>
                )}
            </Fragment>
        ))}
    </>
);

const ITEMS_PER_PAGE = 12;

const ArticlesView = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const categorySlug = searchParams.get('category');
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const sortOrder = searchParams.get('sort') || 'newest';

    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const updateParams = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === undefined) params.delete(key);
            else params.set(key, value);
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchParams, router, pathname]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const apiSort = SORT_MAP[sortOrder] || '-createdAt';
            const paginationParams = { page: currentPage, limit: ITEMS_PER_PAGE, sort: apiSort };

            let result;
            if (categorySlug) {
                result = await getArticlesByCategoryPaginated(categorySlug, paginationParams, { cache: 'no-store' });
            } else {
                result = await getArticlesPaginated(paginationParams, { cache: 'no-store' });
            }
            setArticles(result.data);
            setPagination(result.pagination);

            // Fetch categories for sidebar (only once basically, but needed for display)
            const cats = await fetchCategories();
            setCategories(cats);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: (error as Error).message,
            });
        } finally {
            setIsLoading(false);
        }
    }, [categorySlug, currentPage, sortOrder, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCategoryChange = (slug: string) => {
        if (!slug || slug === 'all') {
            updateParams({ category: null, page: null });
        } else {
            updateParams({ category: slug, page: null });
        }
    };

    const handleSortChange = (newSort: string) => {
        updateParams({ sort: newSort, page: null });
    };

    const handlePageChange = (page: number) => {
        updateParams({ page: String(page) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const currentCategoryName = useMemo(() => {
        if (!categorySlug) return "Tất cả bài viết";
        return findCategoryBySlug(categories, categorySlug)?.name || "Bài viết";
    }, [categories, categorySlug]);

    const categoryOptionsToDisplay = useMemo(() => {
        if (!categorySlug) return categories;
        const result = findCategoryWithParent(categorySlug, categories);
        if (result) {
            return result.parent ? [result.parent] : [result.found];
        }
        return categories;
    }, [categorySlug, categories]);

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-headline font-bold text-primary capitalize">{currentCategoryName}</h1>
                <p className="text-muted-foreground mt-2">Hãy chọn cho mình Chuyên mục yêu thích để cùng chúng tôi Mạn Đàm Văn Chương nhé!</p>
            </header>

            <div className="mb-8 flex flex-col sm:flex-row justify-end gap-4">
                <Select onValueChange={handleSortChange} value={sortOrder} disabled={isLoading}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Sắp xếp theo..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="oldest">Cũ nhất</SelectItem>
                        <SelectItem value="a-z">A-Z</SelectItem>
                    </SelectContent>
                </Select>
                <Select onValueChange={handleCategoryChange} value={categorySlug || 'all'} disabled={isLoading}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                        <SelectValue placeholder="Lọc theo danh mục..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                        <CategoryOptions categories={categoryOptionsToDisplay} />
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index}>
                            <Skeleton className="h-[200px] w-full" />
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-1/4 mb-2" />
                                <Skeleton className="h-6 w-full mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                            <CardFooter><Skeleton className="h-4 w-1/2" /></CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                articles.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {articles.map(article => (<ArticleCard key={article._id} article={article} />))}
                        </div>
                        {pagination && (
                            <PaginationControls
                                pagination={pagination}
                                onPageChange={handlePageChange}
                                isLoading={isLoading}
                            />
                        )}
                    </>
                ) : (
                    <div className="text-center py-16"><p className="text-base text-muted-foreground">Không tìm thấy bài viết nào trong danh mục này.</p></div>
                )
            )}
        </div>
    );
};

export default function ArticlesPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Đang tải trang...</div>}>
            <ArticlesView />
        </Suspense>
    );
}
