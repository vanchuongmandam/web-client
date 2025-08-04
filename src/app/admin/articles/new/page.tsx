// src/app/admin/articles/new/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Category, Media } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';


// --- Zod Schema for Validation ---
const articleFormSchema = z.object({
  title: z.string().min(5, { message: "Tiêu đề phải có ít nhất 5 ký tự." }),
  slug: z.string().min(3, { message: "Slug phải có ít nhất 3 ký tự." }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang." }),
  author: z.string().min(2, { message: "Tên tác giả là bắt buộc." }),
  excerpt: z.string().min(10, { message: "Tóm tắt phải có ít nhất 10 ký tự." }),
  content: z.string().min(50, { message: "Nội dung phải có ít nhất 50 ký tự." }),
  category: z.string({ required_error: "Vui lòng chọn một danh mục." }),
  media: z.array(z.object({
      url: z.string(),
      mediaType: z.enum(['image', 'video']),
      caption: z.string().optional(),
  })).min(1, { message: "Bài viết phải có ít nhất một media (ảnh/video)." }),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;


// --- API Functions ---
async function getCategories(): Promise<Category[]> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch(`${apiBaseUrl}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}

async function uploadFile(file: File, token: string): Promise<Media> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const formData = new FormData();
    formData.append('mediaFile', file);
    const res = await fetch(`${apiBaseUrl}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) throw new Error("File upload failed");
    return res.json();
}

async function createArticle(data: ArticleFormValues, token: string) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    // Thêm date vào dữ liệu trước khi gửi
    const dataToSend = {
        ...data,
        date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
    };
    const res = await fetch(`${apiBaseUrl}/articles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create article");
    }
    return res.json();
}


// --- Main Component ---
export default function NewArticlePage() {
    const router = useRouter();
    const { token } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<ArticleFormValues>({
        resolver: zodResolver(articleFormSchema),
        defaultValues: { media: [] },
    });
    const mediaValue = form.watch('media');

    useEffect(() => {
        getCategories().then(setCategories).catch(() => {
            toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải danh mục." });
        });
    }, [toast]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        setIsUploading(true);
        try {
            const newMedia = await uploadFile(file, token);
            // API upload của bạn trả về cả url và mediaType
            form.setValue('media', [...form.getValues('media'), { url: newMedia.url, mediaType: newMedia.mediaType as 'image' | 'video' }]);
        } catch (error) {
            toast({ variant: "destructive", title: "Upload thất bại", description: "Không thể tải file lên." });
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset file input
        }
    };
    
    const removeMedia = (index: number) => {
        const updatedMedia = [...form.getValues('media')];
        updatedMedia.splice(index, 1);
        form.setValue('media', updatedMedia);
    };

    const onSubmit = async (data: ArticleFormValues) => {
        if (!token) return;
        try {
            await createArticle(data, token);
            toast({ title: "Thành công!", description: "Bài viết đã được tạo." });
            router.push('/admin/articles');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Lỗi", description: error.message });
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <header className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-headline font-bold text-primary">Tạo bài viết mới</h1>
                            <p className="text-muted-foreground mt-2">Điền thông tin chi tiết dưới đây.</p>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="outline" asChild><Link href="/admin/articles">Hủy</Link></Button>
                           <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Đăng bài viết
                           </Button>
                        </div>
                    </header>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input placeholder="Tiêu đề bài viết..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="content" render={({ field }) => (
                                <FormItem><FormLabel>Nội dung</FormLabel><FormControl><Textarea placeholder="Soạn thảo nội dung chính..." {...field} rows={20} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        {/* Right Column */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Thông tin bài viết</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="slug" render={({ field }) => (
                                        <FormItem><FormLabel>Slug (URL)</FormLabel><FormControl><Input placeholder="vi-du-slug" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="author" render={({ field }) => (
                                        <FormItem><FormLabel>Tác giả</FormLabel><FormControl><Input placeholder="Tên tác giả" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem><FormLabel>Danh mục</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Chọn một danh mục" /></SelectTrigger></FormControl>
                                                <SelectContent>{categories.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="excerpt" render={({ field }) => (
                                        <FormItem><FormLabel>Đoạn trích (Excerpt)</FormLabel><FormControl><Textarea placeholder="Một đoạn tóm tắt ngắn..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Media</CardTitle></CardHeader>
                                <CardContent>
                                    <FormField control={form.control} name="media" render={() => (
                                        <FormItem>
                                            <FormLabel>File ảnh/video</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Button type="button" variant="outline" asChild>
                                                        <label htmlFor="file-upload" className="cursor-pointer w-full">
                                                            <Upload className="mr-2 h-4 w-4" /> Upload File
                                                        </label>
                                                    </Button>
                                                    <Input id="file-upload" type="file" className="sr-only" onChange={handleFileUpload} disabled={isUploading}/>
                                                    {isUploading && <Loader2 className="absolute right-2 top-2 h-5 w-5 animate-spin"/>}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="mt-4 space-y-2">
                                        {mediaValue.map((m, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                                {m.mediaType === 'image' && m.url && <Image src={m.url} alt="preview" width={40} height={40} className="rounded object-cover"/>}
                                                {m.mediaType !== 'image' && <ImageIcon className="h-10 w-10 text-muted-foreground"/>}
                                                <p className="text-sm truncate flex-1">{m.url.split('/').pop()}</p>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeMedia(index)}><X className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
