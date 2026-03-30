// src/app/admin/documents/edit/[slug]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDocumentBySlug, updateDocument, getCategories } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    author: "",
    category: "",
    price: "",
    originalPrice: "",
    isFree: false,
    fullFile: "",
    previewFile: "",
    fileFormat: "pdf" as "pdf" | "docx" | "zip",
    fileSize: "",
    pageCount: "",
    tags: "",
    status: "draft" as "draft" | "active" | "archived",
    featured: false,
  });

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/");
  }, [user, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [doc, cats] = await Promise.all([
        getDocumentBySlug(slug),
        getCategories(),
      ]);
      if (!doc) {
        toast({ title: "Không tìm thấy tài liệu", variant: "destructive" });
        router.push("/admin/documents");
        return;
      }
      setCategories(cats);
      setForm({
        title: doc.title,
        slug: doc.slug,
        description: doc.description,
        author: doc.author,
        category: typeof doc.category === "object" ? doc.category._id : (doc.category as string),
        price: String(doc.price),
        originalPrice: doc.originalPrice ? String(doc.originalPrice) : "",
        isFree: doc.isFree ?? false,
        fullFile: doc.fullFile ?? "",
        previewFile: doc.previewFile ?? "",
        fileFormat: (doc.fileFormat as "pdf" | "docx" | "zip") ?? "pdf",
        fileSize: doc.fileSize ? String(doc.fileSize) : "",
        pageCount: doc.pageCount ? String(doc.pageCount) : "",
        tags: (doc.tags ?? []).join(", "),
        status: (doc.status as "draft" | "active" | "archived") ?? "draft",
        featured: doc.featured ?? false,
      });
    } catch {
      toast({ title: "Lỗi tải tài liệu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [slug, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        author: form.author.trim(),
        category: form.category,
        price: form.isFree ? 0 : Number(form.price),
        isFree: form.isFree,
        fullFile: form.fullFile.trim(),
        fileFormat: form.fileFormat,
        status: form.status,
        featured: form.featured,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (form.originalPrice) payload.originalPrice = Number(form.originalPrice);
      if (form.previewFile) payload.previewFile = form.previewFile.trim();
      if (form.fileSize) payload.fileSize = Number(form.fileSize);
      if (form.pageCount) payload.pageCount = Number(form.pageCount);

      await updateDocument(slug, payload, token);
      toast({ title: "Đã cập nhật", description: `"${form.title}" đã được cập nhật.` });
      router.push("/admin/documents");
    } catch (err: unknown) {
      toast({
        title: "Lỗi cập nhật",
        description: err instanceof Error ? err.message : "Đã xảy ra lỗi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const flatCategories = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pencil className="h-6 w-6" /> Chỉnh sửa tài liệu
          </h1>
          <p className="text-sm text-muted-foreground">Slug: {slug}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="author">Tác giả *</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) => handleChange("author", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Danh mục *</Label>
                <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {flatCategories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (cách nhau bằng dấu phẩy)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Giá bán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="isFree"
                checked={form.isFree}
                onCheckedChange={(v) => handleChange("isFree", v)}
              />
              <Label htmlFor="isFree">Tài liệu miễn phí</Label>
            </div>

            {!form.isFree && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Giá bán (VNĐ) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={1000}
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    required={!form.isFree}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="originalPrice">Giá gốc</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    min={0}
                    step={1000}
                    value={form.originalPrice}
                    onChange={(e) => handleChange("originalPrice", e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader>
            <CardTitle>File tài liệu</CardTitle>
            <CardDescription>Đường dẫn file trên server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullFile">File đầy đủ *</Label>
              <Input
                id="fullFile"
                value={form.fullFile}
                onChange={(e) => handleChange("fullFile", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="previewFile">File xem trước (tùy chọn)</Label>
              <Input
                id="previewFile"
                value={form.previewFile}
                onChange={(e) => handleChange("previewFile", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fileFormat">Định dạng</Label>
                <Select
                  value={form.fileFormat}
                  onValueChange={(v) => handleChange("fileFormat", v)}
                >
                  <SelectTrigger id="fileFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="zip">ZIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fileSize">Kích thước (KB)</Label>
                <Input
                  id="fileSize"
                  type="number"
                  min={0}
                  value={form.fileSize}
                  onChange={(e) => handleChange("fileSize", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pageCount">Số trang</Label>
                <Input
                  id="pageCount"
                  type="number"
                  min={0}
                  value={form.pageCount}
                  onChange={(e) => handleChange("pageCount", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái xuất bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Bản nháp (ẩn với người dùng)</SelectItem>
                  <SelectItem value="active">Đang bán</SelectItem>
                  <SelectItem value="archived">Đã lưu trữ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="featured"
                checked={form.featured}
                onCheckedChange={(v) => handleChange("featured", v)}
              />
              <Label htmlFor="featured">Tài liệu nổi bật</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
