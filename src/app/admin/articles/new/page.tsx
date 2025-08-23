// src/app/admin/articles/new/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/utils';
import type { Category, Media } from '@/lib/types';

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
  // Updated content to accept JSON object
  content: z.record(z.string(), z.any()).refine(val => Object.keys(val).length > 0, {
    message: "Nội dung là bắt buộc."
  }),
  category: z.string({ required_error: "Vui lòng chọn một danh mục con." }),
  trending: z.boolean().default(false),
  media: z.array(z.object({
      url: z.string(),
      mediaType: z.enum(['image', 'video']),
      caption: z.string().optional(),
  })),
});
type ArticleFormValues = z.infer<typeof articleFormSchema>;

// --- Helper to get correct MIME type from extension ---
const getMimeTypeFromExtension = (filename: string): string | undefined => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
    };
    return extension ? mimeTypes[extension] : undefined;
};


// API calls
async function getCategories(): Promise<Category[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}

async function uploadFile(file: File, token: string, categoryPath: string): Promise<Media> {
    const formData = new FormData();
    formData.append('mediaFile', file);
    formData.append('categoryPath', categoryPath); 
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "File upload failed");
    }
    const data = await res.json();
    return data.media; 
}

async function createArticle(data: ArticleFormValues, token: string) {
    const dataToSend = { ...data, date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) };
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dataToSend)
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create article");
    }
    return res.json();
}

export default function NewArticlePage() {
    const router = useRouter();
    const { token } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [parentCategories, setParentCategories] = useState<Category[]>([]);
    const [childCategories, setChildCategories] = useState<Category[]>([]);
    const [selectedParent, setSelectedParent] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<ArticleFormValues>({
        resolver: zodResolver(articleFormSchema),
        defaultValues: { media: [], title: '', slug: '', author: '', excerpt: '', content: {
          "type": "doc",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": ""
                }
              ]
            }
          ]
        }, trending: false },
    });
    const mediaValue = form.watch('media');
    const titleValue = form.watch('title');

    useEffect(() => {
        const slug = generateSlug(titleValue);
        form.setValue('slug', slug, { shouldValidate: true });
    }, [titleValue, form]);

    useEffect(() => {
        getCategories()
            .then(data => {
                setCategories(data);
                setParentCategories(data.filter(c => c.children && c.children.length > 0));
            })
            .catch(() => toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải danh mục." }));
    }, [toast]);

    const handleParentCategoryChange = (parentId: string) => {
        form.setValue('category', '');
        setSelectedParent(parentId);
        const parent = categories.find(c => c._id === parentId);
        setChildCategories(parent?.children || []);
    };
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0];
        if (!originalFile || !token) return;

        const parentId = selectedParent;
        const childId = form.getValues('category');

        if (!parentId || !childId) {
            toast({ variant: "destructive", title: "Chưa chọn danh mục", description: "Vui lòng chọn danh mục cha và con trước khi upload ảnh." });
            e.target.value = '';
            return;
        }

        const parentSlug = parentCategories.find(p => p._id === parentId)?.slug;
        const childSlug = childCategories.find(c => c._id === childId)?.slug;
        
        if(!parentSlug || !childSlug) {
             toast({ variant: "destructive", title: "Lỗi", description: "Không tìm thấy slug cho danh mục đã chọn." });
             e.target.value = '';
             return;
        }
        
        // --- FIX: Correct MIME type before upload ---
        const correctMimeType = getMimeTypeFromExtension(originalFile.name);
        if (!correctMimeType) {
            toast({ variant: "destructive", title: "Loại file không hỗ trợ", description: "Vui lòng chọn file hình ảnh hoặc video." });
            e.target.value = '';
            return;
        }
        
        const fileToUpload = new File([originalFile], originalFile.name, { type: correctMimeType });
        const categoryPath = `${parentSlug}/${childSlug}`;
        
        setIsUploading(true);
        try {
            const newMedia = await uploadFile(fileToUpload, token, categoryPath);
            form.setValue('media', [...form.getValues('media'), newMedia]);
        } catch (error) {
            toast({ variant: "destructive", title: "Upload thất bại", description: (error as Error).message });
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };
    
    const removeMedia = (index: number) => form.setValue('media', form.getValues('media').filter((_, i) => i !== index));

    const onSubmit = async (data: ArticleFormValues) => {
        if (!token) return;
        try {
            await createArticle(data, token);
            toast({ title: "Thành công!", description: "Bài viết đã được tạo." });
            router.push('/admin/articles');
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast({ variant: "destructive", title: "Lỗi", description: error.message });
            }
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <header className="flex items-center justify-between mb-8">
                        <div><h1 className="text-4xl font-headline font-bold text-primary">Tạo bài viết mới</h1><p className="text-muted-foreground mt-2">Điền thông tin chi tiết dưới đây.</p></div>
                        <div className="flex gap-2">
                           <Button type="button" variant="outline" asChild><Link href="/admin/articles">Hủy</Link></Button>
                           <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Đăng bài viết</Button>
                        </div>
                    </header>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input placeholder="Tiêu đề bài viết..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="content" render={({ field }) => ( <FormItem><FormLabel>Nội dung</FormLabel><FormControl><RichTextEditor placeholder="Soạn thảo..." value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Thông tin bài viết</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="slug" render={({ field }) => ( <FormItem><FormLabel>Slug (URL)</FormLabel><FormControl><Input placeholder="Tự động tạo..." readOnly {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Tác giả</FormLabel><FormControl><Input placeholder="Tên tác giả" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    
                                    <FormItem>
                                        <FormLabel>Danh mục cha</FormLabel>
                                        <Select onValueChange={handleParentCategoryChange} value={selectedParent}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Chọn danh mục cha" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {parentCategories.map(cat => (
                                                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>

                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Danh mục con</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedParent}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Chọn danh mục con" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {childCategories.map(cat => (
                                                        <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="excerpt" render={({ field }) => ( <FormItem><FormLabel>Đoạn trích</FormLabel><FormControl><Textarea placeholder="Tóm tắt ngắn..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                                     <FormField control={form.control} name="trending" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5"><FormLabel>Bài viết nổi bật</FormLabel></div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Media</CardTitle></CardHeader>
                                <CardContent>
                                    <FormItem><FormLabel>Ảnh đại diện</FormLabel><FormControl><div className="relative"><Button type="button" variant="outline" asChild><label htmlFor="file-upload" className="cursor-pointer w-full"><Upload className="mr-2 h-4 w-4" /> Upload File</label></Button><Input id="file-upload" type="file" className="sr-only" onChange={handleFileUpload} disabled={isUploading}/>{isUploading && <Loader2 className="absolute right-2 top-2 h-5 w-5 animate-spin"/>}</div></FormControl><FormMessage /></FormItem>
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
