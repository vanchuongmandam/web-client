// src/app/admin/documents/edit/[slug]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDocumentBySlug, updateDocument, getDocumentCategories, getDocumentCollections } from "@/lib/api";
import type { DocumentCategory, DocumentCollection } from "@/lib/types";
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
import { Loader2, ArrowLeft, Pencil, FileText, UploadCloud, X } from "lucide-react";
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

  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [availableCollections, setAvailableCollections] = useState<DocumentCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFullUploading, setIsFullUploading] = useState(false);
  const [isPreviewUploading, setIsPreviewUploading] = useState(false);
  const [isImagesUploading, setIsImagesUploading] = useState(false);
  const [fullUploadProgress, setFullUploadProgress] = useState(0);
  const [previewUploadProgress, setPreviewUploadProgress] = useState(0);
  const [imagesUploadProgress, setImagesUploadProgress] = useState(0);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: null as Record<string, unknown> | null,
    author: "",
    category: "",
    collections: [] as string[],
    price: "",
    originalPrice: "",
    isFree: false,
    fullFile: "",
    previewFile: "",
    coverImage: "",
    previewImages: [] as string[],
    fileFormat: "pdf" as "pdf" | "docx" | "zip",
    fileSize: "",
    pageCount: "",
    tags: "",
    status: "draft" as "draft" | "active" | "archived",
    featured: false,
    allowDownload: true,
  });

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/");
  }, [user, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [doc, cats, cols] = await Promise.all([
        getDocumentBySlug(slug, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
        getDocumentCategories(),
        getDocumentCollections(),
      ]);
      if (!doc) {
        toast({ title: "Không tìm thấy tài liệu", variant: "destructive" });
        router.push("/admin/documents");
        return;
      }

      const normalizedDescription =
        typeof doc.description === "object" && doc.description !== null
          ? (doc.description as Record<string, unknown>)
          : typeof doc.description === "string" && doc.description.trim()
            ? {
                type: "doc",
                content: [{ type: "paragraph", content: [{ type: "text", text: doc.description }] }],
              }
            : null;

      setCategories(cats);
      setAvailableCollections(cols);
      setForm({
        title: doc.title,
        slug: doc.slug,
        description: normalizedDescription,
        author: doc.author,
        category: typeof doc.category === "object" ? doc.category._id : (doc.category as string),
        collections: (doc.collections || []).map(c => typeof c === 'object' ? c._id : c),
        price: String(doc.price),
        originalPrice: doc.originalPrice ? String(doc.originalPrice) : "",
        isFree: doc.isFree ?? false,
        fullFile: doc.fullFile ?? "",
        previewFile: doc.previewFile ?? "",
        coverImage: doc.coverImage ?? "",
        previewImages: doc.previewImages ?? [],
        fileFormat: (doc.fileFormat as "pdf" | "docx" | "zip") ?? "pdf",
        fileSize: doc.fileSize ? String(doc.fileSize) : "",
        pageCount: doc.pageCount ? String(doc.pageCount) : "",
        tags: (doc.tags ?? []).join(", "),
        status: (doc.status as "draft" | "active" | "archived") ?? "draft",
        featured: doc.featured ?? false,
        allowDownload: doc.allowDownload ?? true,
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
    value: string | boolean | Record<string, unknown> | string[] | null,
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
        collections: form.collections,
        price: form.isFree ? 0 : Number(form.price),
        isFree: form.isFree,
        fullFile: form.fullFile.trim(),
        fileFormat: form.fileFormat,
        status: form.status,
        featured: form.featured,
        allowDownload: form.allowDownload,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (form.originalPrice) payload.originalPrice = Number(form.originalPrice);
      if (form.previewFile) payload.previewFile = form.previewFile.trim();
      if (form.coverImage) payload.coverImage = form.coverImage.trim();
      // Always send previewImages array, even if empty, so the admin can clear it if they delete all preview images.
      payload.previewImages = form.previewImages;
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" form="document-form" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <form id="document-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nội dung tài liệu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold">Tiêu đề *</Label>
                <Input
                  id="title"
                  className="text-lg py-6"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Ví dụ: Tuyển tập đề thi môn Văn..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="font-semibold">Slug *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  placeholder="tuyen-tap-de-thi-mon-van"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Mô tả chi tiết *</Label>
                <div className="min-h-[300px]">
                  <RichTextEditor
                    content={form.description ?? undefined}
                    onChange={(html) => handleChange("description", html)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Files & Upload</CardTitle>
              <CardDescription>Tải lên bản gốc để bán và bản xem trước (nếu có)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="fullFile" className="font-semibold text-base">File tài liệu gốc *</Label>
                {!form.fullFile ? (
                  <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-xl text-center hover:bg-muted/30 transition-colors h-[160px] flex items-center justify-center">
                    <Input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                        } catch (err: any) {
                          toast({
                            title: "Cảnh báo",
                            description: err.message,
                            variant: "destructive",
                          });
                        } finally {
                          setIsFullUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    <div className="flex flex-col items-center gap-2 pointer-events-none mt-2">
                      <div className="p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="font-medium text-sm">Nhấn hoặc kéo thả file gốc vào đây</p>
                      <p className="text-xs text-muted-foreground">Hỗ trợ các định dạng tập tin. Max 100MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 pr-4">
                        <p
                          className="text-sm font-semibold truncate text-foreground"
                          title={form.fullFile.split("/").pop() || "Document file"}
                        >
                          {form.fullFile.split("/").pop() || "Đã tải lên file gốc"}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium">Tải lên hoàn tất</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        handleChange("fullFile", "");
                        handleChange("fileSize", "");
                        handleChange("pageCount", "");
                      }}
                    >
                      <X className="w-4 h-4 mr-2" /> Gỡ bỏ file
                    </Button>
                  </div>
                )}

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

              <div className="space-y-3">
                <Label htmlFor="previewFile" className="font-semibold text-base">File bản xem trước (Mẫu rút gọn)</Label>
                {!form.previewFile ? (
                  <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-xl text-center hover:bg-muted/30 transition-colors h-[120px] flex items-center justify-center">
                    <Input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                        } catch (err: any) {
                          toast({ title: "Lỗi", description: err.message, variant: "destructive" });
                        } finally {
                          setIsPreviewUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    <div className="flex flex-col items-center gap-1 pointer-events-none mt-2">
                      <UploadCloud className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground font-medium">Đăng tải bản xem trước (nếu có)</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 pr-4">
                        <p
                          className="text-sm font-semibold truncate text-foreground"
                          title={form.previewFile.split("/").pop() || "Preview file"}
                        >
                          {form.previewFile.split("/").pop() || "Đã tải file xem trước"}
                        </p>
                        <p className="text-xs text-blue-600 font-medium">Tải lên hoàn tất</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleChange("previewFile", "")}
                    >
                      Xóa
                    </Button>
                  </div>
                )}

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

              <div className="space-y-3 pt-2">
                <Label className="font-semibold text-base flex items-center gap-1.5">
                  <span>Ảnh xem trước (Preview Images) & Banner</span>
                  <Badge variant="outline" className="text-[10px] font-normal border-zinc-200">Không bắt buộc</Badge>
                </Label>
                
                {/* Upload zone for preview images */}
                <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-xl text-center hover:bg-muted/30 transition-colors h-[120px] flex items-center justify-center">
                  <Input 
                    type="file" 
                    multiple
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isImagesUploading}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0 || !token) return;
                      setIsImagesUploading(true);
                      setImagesUploadProgress(0);
                      
                      let uploadedCount = 0;
                      const newUrls: string[] = [];
                      for (const file of files) {
                        try {
                          const media = await uploadFileWithProgress(
                            file,
                            token,
                            "documents",
                            (p) => {
                              // Calculate overall progress
                              const singleProgress = p / files.length;
                              const baseProgress = (uploadedCount / files.length) * 100;
                              setImagesUploadProgress(Math.round(baseProgress + singleProgress));
                            }
                          );
                          newUrls.push(media.url);
                          uploadedCount++;
                        } catch (err: any) {
                          toast({ title: "Lỗi tải ảnh", description: err.message, variant: "destructive" });
                        }
                      }
                      
                      if (newUrls.length > 0) {
                        const updatedImages = [...(form.previewImages || []), ...newUrls];
                        handleChange("previewImages", updatedImages);
                        // If no cover image was selected, set the first uploaded image as the cover image
                        if (!form.coverImage) {
                          handleChange("coverImage", newUrls[0]);
                        }
                        toast({ title: "Đã tải lên " + newUrls.length + " ảnh xem trước" });
                      }
                      setIsImagesUploading(false);
                      e.target.value = "";
                    }} 
                  />
                  <div className="flex flex-col items-center gap-1 pointer-events-none mt-2">
                    <UploadCloud className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground font-medium">Nhấn hoặc kéo thả nhiều ảnh xem trước</p>
                    <p className="text-[10px] text-muted-foreground">Chỉ chấp nhận file hình ảnh (JPEG, PNG, v.v.)</p>
                  </div>
                </div>

                {isImagesUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Đang tải các ảnh xem trước...</span>
                      <span>{imagesUploadProgress}%</span>
                    </div>
                    <Progress value={imagesUploadProgress} className="h-2" />
                  </div>
                )}

                {/* Grid layout of uploaded preview images */}
                {form.previewImages && form.previewImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mt-4">
                    {form.previewImages.map((imgUrl, idx) => {
                      const isCover = form.coverImage === imgUrl;
                      return (
                        <div key={idx} className={`relative aspect-[1/1.38] rounded-xl border-2 overflow-hidden bg-[#fcf9f2] p-1 shadow-sm transition-all group ${isCover ? 'border-[#4c6b54] ring-2 ring-[#4c6b54]/20' : 'border-zinc-200'}`}>
                          <img 
                            src={imgUrl} 
                            alt={`Preview ${idx + 1}`} 
                            className="w-full h-full object-cover rounded-lg"
                          />
                          
                          {/* Hover Overlay Actions */}
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            {/* Delete Button */}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7 rounded-full ml-auto"
                              onClick={() => {
                                const updatedImages = form.previewImages.filter(url => url !== imgUrl);
                                handleChange("previewImages", updatedImages);
                                if (isCover) {
                                  handleChange("coverImage", updatedImages.length > 0 ? updatedImages[0] : "");
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            
                            {/* Set Cover Button */}
                            <Button
                              type="button"
                              variant={isCover ? "default" : "secondary"}
                              size="sm"
                              className="w-full font-bold text-xs h-7 bg-[#4c6b54] text-white hover:bg-[#3b5341]"
                              onClick={() => handleChange("coverImage", imgUrl)}
                            >
                              {isCover ? "Ảnh bìa chính" : "Chọn làm ảnh bìa"}
                            </Button>
                          </div>
                          
                          {/* Banner Indicator badge when not hovered */}
                          {isCover && (
                            <Badge className="absolute top-2 left-2 bg-[#4c6b54] text-white border-none text-[9px] font-bold py-0.5 px-1.5 shadow-sm">
                              Ảnh bìa chính
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-dashed bg-muted/20 p-4">
                <p className="text-sm font-semibold">Metadata tự động từ file gốc</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">Định dạng: {form.fileFormat.toUpperCase()}</Badge>
                  <Badge variant="secondary">
                    Kích thước: {form.fileSize ? `${form.fileSize} KB` : "--"}
                  </Badge>
                  <Badge variant="secondary">
                    Số trang: {form.pageCount ? form.pageCount : "--"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Hệ thống tự detect sau khi upload. Bạn không cần nhập tay.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-base">Trạng thái xuất bản</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger id="status" className="font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bản nháp (Đang ẩn)</SelectItem>
                    <SelectItem value="active">Đang bán (Công khai)</SelectItem>
                    <SelectItem value="archived">Đã lưu trữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <Label htmlFor="featured" className="cursor-pointer font-medium text-muted-foreground">Tài liệu nổi bật (Ghim)</Label>
                <Switch id="featured" checked={form.featured} onCheckedChange={(v) => handleChange("featured", v)} />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <Label htmlFor="allowDownload" className="cursor-pointer font-medium text-muted-foreground">Cho phép tải file gốc</Label>
                <Switch id="allowDownload" checked={form.allowDownload} onCheckedChange={(v) => handleChange("allowDownload", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-base">Mức giá</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="isFree" className="cursor-pointer font-medium text-emerald-600">Miễn phí hoàn toàn</Label>
                <Switch id="isFree" checked={form.isFree} onCheckedChange={(v) => handleChange("isFree", v)} />
              </div>

              {!form.isFree && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price">Giá bán / Ưu đãi (VNĐ) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      step={1000}
                      value={form.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      required
                      className="font-semibold text-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="originalPrice">Giá gốc (VNĐ)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      min={0}
                      value={form.originalPrice}
                      onChange={(e) => handleChange("originalPrice", e.target.value)}
                      className="text-muted-foreground line-through"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-base">Phân loại</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Danh mục *</Label>
                <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger id="category"><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                  <SelectContent>
                    {flatCategories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Bộ sưu tập</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2 bg-background">
                  {availableCollections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có bộ sưu tập nào.</p>
                  ) : (
                    availableCollections.map(col => (
                      <div key={col._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`col-${col._id}`}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={form.collections.includes(col._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleChange("collections", [...form.collections, col._id]);
                            } else {
                              handleChange("collections", form.collections.filter(id => id !== col._id));
                            }
                          }}
                        />
                        <Label htmlFor={`col-${col._id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                          {col.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="author">Tác giả *</Label>
                <Input id="author" value={form.author} onChange={(e) => handleChange("author", e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags (cách nhau bởi dấu phẩy)</Label>
                <Textarea
                  id="tags"
                  value={form.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="văn học, lớp 12..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
