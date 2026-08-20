
"use client";

import { useState, useEffect, useMemo, Suspense, Fragment, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Article, Category, PaginationMeta } from '@/lib/types';
import { getArticlesPaginated, getArticlesByCategoryPaginated } from '@/lib/api';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { findCategoryBySlug, findCategoryWithParent, formatVietnameseDate } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination-controls';
import ArticleCard from '@/components/articles/ArticleCard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';

async function fetchCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
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
                <h1 className="text-3xl font-sans font-bold text-primary capitalize">{currentCategoryName}</h1>
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
                        <div key={index} className="h-full flex flex-col border rounded-lg overflow-hidden animate-pulse">
                            <div className="h-[200px] w-full bg-muted" />
                            <div className="p-4 flex-grow space-y-2">
                                <div className="h-4 w-1/4 bg-muted rounded" />
                                <div className="h-6 w-full bg-muted rounded" />
                                <div className="h-4 w-full bg-muted rounded" />
                            </div>
                            <div className="p-4 pt-0">
                                <div className="h-4 w-1/2 bg-muted rounded" />
                            </div>
                        </div>
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
