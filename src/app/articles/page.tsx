// src/app/articles/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Article, Category } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// --- Các hàm gọi API ---

// Lấy tất cả bài viết
async function getArticles(): Promise<Article[]> {
    try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/articles`, { next: { revalidate: 3600 } });
        if (!response.ok) throw new Error("Failed to fetch articles");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Lấy tất cả danh mục
async function getCategories(): Promise<Category[]> {
    try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/categories`, { next: { revalidate: 3600 } });
        if (!response.ok) throw new Error("Failed to fetch categories");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}


// --- Component con để hiển thị thẻ bài viết ---
const ArticleCard = ({ article }: { article: Article }) => (
    <Card className="h-full flex flex-col overflow-hidden group transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl">
        <CardHeader className="p-0">
            <div className="relative aspect-video w-full">
                <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <Badge variant="outline" className="mb-2">{article.category.name}</Badge>
            <CardTitle className="font-headline text-xl leading-tight mb-2">
                <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">
                    {article.title}
                </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">{article.author} &bull; {new Date(article.date).toLocaleDateString('vi-VN')}</p>
        </CardFooter>
    </Card>
);

// --- Component chính của trang ---
export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Lấy dữ liệu từ server khi component được mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [articlesData, categoriesData] = await Promise.all([
                getArticles(),
                getCategories()
            ]);
            setArticles(articlesData);
            setFilteredArticles(articlesData);
            setCategories(categoriesData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    // Xử lý khi người dùng thay đổi bộ lọc
    const handleFilterChange = (categorySlug: string) => {
        setSelectedCategory(categorySlug);
        if (categorySlug === 'all') {
            setFilteredArticles(articles);
        } else {
            const filtered = articles.filter(article => article.category.slug === categorySlug);
            setFilteredArticles(filtered);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8">
                <h1 className="text-4xl font-headline font-bold text-primary">Tất cả bài viết</h1>
                <p className="text-muted-foreground mt-2">Khám phá kho tàng tri thức và những sáng tác đặc sắc của chúng tôi.</p>
            </header>

            {/* Thanh Filter */}
            <div className="mb-8 flex justify-end">
                <Select onValueChange={handleFilterChange} defaultValue="all" disabled={isLoading}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Lọc theo danh mục..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                        {categories.map(category => (
                            <SelectItem key={category._id} value={category.slug}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Lưới hiển thị bài viết */}
            {isLoading ? (
                // Giao diện tải trang (Skeleton)
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index}>
                            <Skeleton className="h-[200px] w-full" />
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-1/4 mb-2" />
                                <Skeleton className="h-6 w-full mb-2" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4 mt-1" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-4 w-1/2" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                filteredArticles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredArticles.map(article => (
                            <ArticleCard key={article._id} article={article} />
                        ))}
                    </div>
                ) : (
                    // Thông báo khi không có kết quả
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground">Không tìm thấy bài viết nào phù hợp.</p>
                    </div>
                )
            )}
        </div>
    );
}
