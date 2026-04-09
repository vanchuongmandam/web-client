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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadFileWithProgress } from "@/lib/api";

const RichTextEditor = dynamic(() => import("@/components/ui/rich-text-editor"), {
  ssr: false,
  loading: () => <Skeleton className="h-[250px] w-full rounded-md" />,
});

function detectFileFormat(file: File): "pdf" | "docx" | "zip" {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  if (name.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  return "zip";
}

async function detectPdfPageCount(file: File): Promise<number | null> {
  const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
  if (!isPdf) return null;

  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch {
    return null;
  }
}

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFullUploading, setIsFullUploading] = useState(false);
  const [isPreviewUploading, setIsPreviewUploading] = useState(false);
  const [fullUploadProgress, setFullUploadProgress] = useState(0);
  const [previewUploadProgress, setPreviewUploadProgress] = useState(0);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: null as Record<string, unknown> | null,
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
        description:
          typeof doc.description === "object" && doc.description !== null
            ? (doc.description as Record<string, unknown>)
            : null,
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

  const handleChange = (
    field: string,
    value: string | boolean | Record<string, unknown> | null,
  ) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const applyDetectedMetadata = async (file: File) => {
    const detectedFormat = detectFileFormat(file);
    handleChange("fileFormat", detectedFormat);
    handleChange("fileSize", String(Math.max(1, Math.round(file.size / 1024))));

    if (detectedFormat === "pdf") {
      const pageCount = await detectPdfPageCount(file);
      if (pageCount !== null) {
        handleChange("pageCount", String(pageCount));
      }
    } else {
      handleChange("pageCount", "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description,
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
                placeholder="Ví dụ: Tuyển tập đề thi môn Văn..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="tuyen-tap-de-thi-mon-van"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Mô tả tài liệu *</Label>
              <RichTextEditor
                content={form.description ?? undefined}
                onChange={(html) => handleChange("description", html)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="author">Tác giả *</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) => handleChange("author", e.target.value)}
                  placeholder="Họ tên tác giả hoặc nguồn..."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Danh mục *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => handleChange("category", v)}
                >
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
              <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="văn học, lớp 12, đề thi..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Files */}
        <Card>
          <CardHeader>
            <CardTitle>Giá & File tài liệu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
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
                    placeholder="50000"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="originalPrice">Giá gốc (nếu có giảm giá)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    min={0}
                    value={form.originalPrice}
                    onChange={(e) => handleChange("originalPrice", e.target.value)}
                    placeholder="75000"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="fullFile">File tài liệu (File gốc) *</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="fullFile"
                  value={form.fullFile}
                  onChange={(e) => handleChange("fullFile", e.target.value)}
                  placeholder="URL file hoặc chọn file tải lên..."
                  required
                />
                <Input 
                  type="file" 
                  className="sm:w-[220px] cursor-pointer"
                  disabled={isFullUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !token) return;
                    setIsFullUploading(true);
                    setFullUploadProgress(0);
                    try {
                      const media = await uploadFileWithProgress(
                        file,
                        token,
                        "documents",
                        setFullUploadProgress,
                      );
                      handleChange("fullFile", media.url);
                      await applyDetectedMetadata(file);
                      toast({ title: "Tải lên thành công" });
                    } catch(err: any) {
                      toast({ title: "Tải lên thất bại", description: err.message, variant: "destructive" });
                    } finally {
                      setIsFullUploading(false);
                      e.target.value = "";
                    }
                  }} 
                />
              </div>

              {isFullUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Đang tải file gốc...</span>
                    <span>{fullUploadProgress}%</span>
                  </div>
                  <Progress value={fullUploadProgress} className="h-2" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="previewFile">File xem trước (PDF rút gọn hoặc mẫu)</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="previewFile"
                  value={form.previewFile || ""}
                  onChange={(e) => handleChange("previewFile", e.target.value)}
                  placeholder="URL file hoặc chọn file tải lên..."
                />
                <Input 
                  type="file" 
                  className="sm:w-[220px] cursor-pointer"
                  disabled={isPreviewUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !token) return;
                    setIsPreviewUploading(true);
                    setPreviewUploadProgress(0);
                    try {
                      const media = await uploadFileWithProgress(
                        file,
                        token,
                        "documents",
                        setPreviewUploadProgress,
                      );
                      handleChange("previewFile", media.url);
                      toast({ title: "Tải lên thành công" });
                    } catch(err: any) {
                      toast({ title: "Tải lên thất bại", description: err.message, variant: "destructive" });
                    } finally {
                      setIsPreviewUploading(false);
                      e.target.value = "";
                    }
                  }} 
                />
              </div>

              {isPreviewUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Đang tải file xem trước...</span>
                    <span>{previewUploadProgress}%</span>
                  </div>
                  <Progress value={previewUploadProgress} className="h-2" />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-dashed bg-muted/20 p-4">
              <p className="text-sm font-semibold">Metadata</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">Định dạng: {form.fileFormat.toUpperCase()}</Badge>
                <Badge variant="secondary">
                  Kích thước: {form.fileSize ? `${form.fileSize} KB` : "--"}
                </Badge>
                <Badge variant="secondary">
                  Số trang: {form.pageCount ? form.pageCount : "--"}
                </Badge>
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
