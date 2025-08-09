// src/app/admin/articles/edit/[slug]/page.tsx
"use client";
export const runtime = 'edge';

import { useState, useEffect, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/utils';
import type { Category, Media, Article } from '@/lib/types';

import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';

const RichTextEditor = dynamic(() => import('@/components/ui/rich-text-editor'), { 
  ssr: false,
  loading: () => <Skeleton className="h-[250px] w-full rounded-md" />,
});

const articleFormSchema = z.object({
  title: z.string().min(5, { message: "Tiêu đề phải có ít nhất 5 ký tự." }),
  slug: z.string().min(3, { message: "Slug phải có ít nhất 3 ký tự." }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang." }),
  author: z.string().min(2, { message: "Tên tác giả là bắt buộc." }),
  excerpt: z.string().min(10, { message: "Tóm tắt phải có ít nhất 10 ký tự." }),
  content: z.string().min(10, { message: "Nội dung là bắt buộc." }),
  category: z.string({ required_error: "Vui lòng chọn một danh mục." }),
  trending: z.boolean().default(false),
  media: z.array(z.object({
      url: z.string(),
      mediaType: z.enum(['image', 'video']),
      caption: z.string().optional(),
  })),
});
type ArticleFormValues = z.infer<typeof articleFormSchema>;

async function getCategories(): Promise<Category[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}
async function uploadFile(file: File, token: string): Promise<Media> {
    const formData = new FormData();
    formData.append('mediaFile', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) throw new Error("File upload failed");
    const data = await res.json();
    return { url: data.url, mediaType: data.mediaType };
}
async function getArticleBySlug(slug: string): Promise<Article | null> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/articles/${slug}`);
    if (!res.ok) return null;
    return res.json();
}
async function updateArticle(slug: string, data: ArticleFormValues, token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update article");
    }
    return res.json();
}

const CategoryOptions = ({ categories, level = 0 }: { categories: Category[], level?: number }) => {
  return (
    <>
      {categories.map(category => (
        <Fragment key={category._id}>
          <SelectItem value={category._id}>
            {'— '.repeat(level)}{category.name}
          </SelectItem>
          {category.children && category.children.length > 0 && (
            <CategoryOptions categories={category.children} level={level + 1} />
          )}
        </Fragment>
      ))}
    </>
  );
};

export default function EditArticlePage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const { token } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const form = useForm<ArticleFormValues>({
        resolver: zodResolver(articleFormSchema),
        defaultValues: { media: [], title: '', slug: '', author: '', excerpt: '', content: '', trending: false },
    });
    const mediaValue = form.watch('media');
    const titleValue = form.watch('title');

    useEffect(() => {
        if (form.formState.isDirty) {
            const newSlug = generateSlug(titleValue);
            form.setValue('slug', newSlug, { shouldValidate: true });
        }
    }, [titleValue, form]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [cats, articleData] = await Promise.all([ getCategories(), getArticleBySlug(slug) ]);
                setCategories(cats);
                if (articleData) {
                    form.reset({ ...articleData, category: articleData.category._id });
                } else {
                     toast({ variant: "destructive", title: "Lỗi", description: "Không tìm thấy bài viết." });
                     router.push('/admin/articles');
                }
            } catch (error) {
                 toast({ variant: "destructive", title: "Lỗi", description: (error as Error).message });
            } finally {
                setIsLoadingData(false);
            }
        };
        if(slug) fetchData();
    }, [slug, form, router, toast]);

    // ... (các hàm khác giữ nguyên)

    const onSubmit = async (data: ArticleFormValues) => {
        if (!token) return;
        try {
            await updateArticle(slug, data, token);
            toast({ title: "Thành công!", description: "Bài viết đã được cập nhật." });
            router.push('/admin/articles');
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast({ variant: "destructive", title: "Lỗi", description: error.message });
            }
        }
    };
    
    if (isLoadingData) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin"/></div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <header className="flex items-center justify-between mb-8">
                        <div><h1 className="text-4xl font-headline font-bold text-primary">Chỉnh sửa bài viết</h1><p className="text-muted-foreground mt-2">Cập nhật: <span className="font-semibold text-foreground">{form.getValues('title')}</span></p></div>
                        <div className="flex gap-2">
                           <Button type="button" variant="outline" asChild><Link href="/admin/articles">Hủy</Link></Button>
                           <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cập nhật</Button>
                        </div>
                    </header>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="content" render={({ field }) => ( <FormItem><FormLabel>Nội dung</FormLabel><FormControl><RichTextEditor placeholder="Soạn thảo..." value={field.value} onChange={field.onChange}/></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Thông tin bài viết</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="slug" render={({ field }) => ( <FormItem><FormLabel>Slug (URL)</FormLabel><FormControl><Input readOnly {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Tác giả</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem><FormLabel>Danh mục</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger></FormControl>
                                            <SelectContent><CategoryOptions categories={categories} /></SelectContent>
                                            </Select><FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="excerpt" render={({ field }) => ( <FormItem><FormLabel>Đoạn trích</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                                     <FormField control={form.control} name="trending" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5"><FormLabel>Bài viết nổi bật</FormLabel></div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                            {/* Card Media giữ nguyên */}
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
