// src/app/articles/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense, Fragment } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Article, Category } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// --- API Functions (Throw error on failure) ---
async function getArticles(): Promise<Article[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/articles`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Không thể tải danh sách bài viết.");
    return await res.json();
}
async function getCategories(): Promise<Category[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Không thể tải danh sách danh mục.");
    return await res.json();
}

// --- Sub-components ---
const ArticleCard = ({ article }: { article: Article }) => (
    <Card className="h-full flex flex-col overflow-hidden group transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl">
        <CardHeader className="p-0">
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
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <Badge variant="outline" className="mb-2">{article.category.name}</Badge>
            <CardTitle className="font-headline text-xl leading-tight mb-2">
                <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">{article.title}</Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">{article.author} &bull; {article.date}</p>
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
                        <SelectItem value={category.slug}>Tất cả danh mục</SelectItem>
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

// Helper function to find a category and its parent
const findCategoryWithParent = (
    slug: string, 
    categories: Category[], 
    parent: Category | null = null
): { found: Category; parent: Category | null } | null => {
    for (const category of categories) {
        if (category.slug === slug) {
            return { found: category, parent };
        }
        if (category.children && category.children.length > 0) {
            const result = findCategoryWithParent(slug, category.children, category);
            if (result) return result;
        }
    }
    return null;
};


const ArticlesView = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    
    const categorySlug = searchParams.get('category');

    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [articleData, categoryData] = await Promise.all([getArticles(), getCategories()]);
                setArticles(articleData);
                setCategories(categoryData);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: (error as Error).message,
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const handleCategoryChange = (slug: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (!slug) {
            params.delete('category');
        } else {
            params.set('category', slug);
        }
        router.push(`${pathname}?${params.toString()}`);
    };
    
    const filteredArticles = useMemo(() => {
        if (!categorySlug) return articles;

        const getAllChildSlugs = (category: Category): string[] => {
            let slugs = [category.slug];
            if (category.children && category.children.length > 0) {
                category.children.forEach(child => {
                    slugs = slugs.concat(getAllChildSlugs(child));
                });
            }
            return slugs;
        };

        const findCategoryBySlug = (cats: Category[], slug: string): Category | null => {
            for (const cat of cats) {
                if (cat.slug === slug) return cat;
                if (cat.children) {
                    const found = findCategoryBySlug(cat.children, slug);
                    if (found) return found;
                }
            }
            return null;
        }

        const selectedCategory = findCategoryBySlug(categories, categorySlug);
        if (!selectedCategory) return [];

        const validSlugs = getAllChildSlugs(selectedCategory);
        return articles.filter(article => validSlugs.includes(article.category.slug));
    }, [articles, categories, categorySlug]);

    const currentCategoryName = useMemo(() => {
        if (!categorySlug) return "Tất cả bài viết";
        const findCategory = (cats: Category[], slug:string): Category | null => {
             for (const cat of cats) {
                if (cat.slug === slug) return cat;
                if (cat.children) {
                    const found = findCategory(cat.children, slug);
                    if (found) return found;
                }
            }
            return null;
        }
        return findCategory(categories, categorySlug)?.name || "Bài viết";
    }, [categories, categorySlug]);

    const categoryOptionsToDisplay = useMemo(() => {
        if (!categorySlug) {
            return categories; // Show all categories if none is selected
        }
        const result = findCategoryWithParent(categorySlug, categories);
        if (result) {
            // If the selected category has a parent, show only that parent and its children
            if (result.parent) {
                return [result.parent];
            }
            // If the selected category is a parent itself, show only it and its children
            return [result.found];
        }
        return categories; // Fallback
    }, [categorySlug, categories]);
    
    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-headline font-bold text-primary capitalize">{currentCategoryName}</h1>
                <p className="text-muted-foreground mt-2">Khám phá kho tàng tri thức và những sáng tác đặc sắc của chúng tôi.</p>
            </header>

            <div className="mb-8 flex justify-end">
                <Select onValueChange={handleCategoryChange} value={categorySlug || ''} disabled={isLoading}>
                    <SelectTrigger className="w-[280px]"><SelectValue placeholder="Lọc theo danh mục..." /></SelectTrigger>
                    <SelectContent>
                        <CategoryOptions categories={categoryOptionsToDisplay} />
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, index) => (<Card key={index}><Skeleton className="h-[200px] w-full" /><CardContent className="p-4"><Skeleton className="h-4 w-1/4 mb-2" /><Skeleton className="h-6 w-full mb-2" /><Skeleton className="h-4 w-full" /></CardContent><CardFooter><Skeleton className="h-4 w-1/2" /></CardFooter></Card>))}
                </div>
            ) : (
                filteredArticles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredArticles.map(article => ( <ArticleCard key={article._id} article={article} /> ))}
                    </div>
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
