const fs = require('fs');
const path = require('path');

const filesToEdit = [
    'src/app/admin/documents/new/page.tsx',
    'src/app/admin/documents/edit/[slug]/page.tsx'
];

filesToEdit.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) return console.log('Not found:', file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Add imports
    if (!content.includes('import dynamic from "next/dynamic";')) {
        content = content.replace(
            'import Link from "next/link";',
            import Link from "next/link";\nimport dynamic from "next/dynamic";\nimport { Skeleton } from "@/components/ui/skeleton";\nimport { uploadFile } from "@/lib/api";\n\nconst RichTextEditor = dynamic(() => import("@/components/ui/rich-text-editor"), {\n  ssr: false,\n  loading: () => <Skeleton className="h-[250px] w-full rounded-md" />,\n});
        );
    }

    // 2. Modify form initial state description type if it's new/page.tsx
    if (file.includes('new/page.tsx')) {
        content = content.replace(
                description: "",\n    author: "",,
                description: null as any,\n    author: "",
        );
        content = content.replace(
            description: form.description.trim(),,
            description: form.description,
        );
    }

    // 3. Modify RichTextEditor for description
    const descriptionTextareaRegex = /<Textarea[\s\S]*?id="description"[\s\S]*?onChange=\{\(e\) => handleChange\("description", e\.target\.value\)\}[\s\S]*?\/>/;
    if (descriptionTextareaRegex.test(content)) {
        content = content.replace(
            descriptionTextareaRegex,
            <RichTextEditor
                value={form.description || { type: "doc", content: [] }}
                onChange={(value) => handleChange("description", value)}
                placeholder="Mô tả nội dung, điểm nổi bật của tài liệu..."
              />
        );
    }

    // 4. Modify fullFile upload Input
    const fullFileInputRegex = /<Input[\s\S]*?id="fullFile"[\s\S]*?onChange=\{\(e\) => handleChange\("fullFile", e\.target\.value\)\}[\s\S]*?\/>/;
    if (fullFileInputRegex.test(content)) {
        content = content.replace(
            fullFileInputRegex,
            
                <div className="flex gap-2">
                  <Input
                    id="fullFile"
                    value={form.fullFile}
                    onChange={(e) => handleChange("fullFile", e.target.value)}
                    placeholder="URL file hoặc chọn file tải lên..."
                    required
                  />
                  <Input 
                    type="file" 
                    className="w-[150px]"
                    onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (!file || !token) return;
                       toast({ title: "Đang tải lên...", description: "Đang xử lý tải lên file đầy đủ." });
                       try {
                          const media = await uploadFile(file, token, 'documents');
                          handleChange("fullFile", media.url);
                          toast({ title: "Tải lên thành công" });
                       } catch(err: any) {
                          toast({ title: "Tải lên thất bại", description: err.message, variant: "destructive" });
                       } finally {
                          e.target.value = "";
                       }
                    }} 
                  />
                </div>
        );
    }

    // 5. Modify previewFile upload Input
    const previewFileInputRegex = /<Input[\s\S]*?id="previewFile"[\s\S]*?onChange=\{\(e\) => handleChange\("previewFile", e\.target\.value\)\}[\s\S]*?\/>/;
    if (previewFileInputRegex.test(content)) {
        content = content.replace(
            previewFileInputRegex,
            
                <div className="flex gap-2">
                  <Input
                    id="previewFile"
                    value={form.previewFile || ""}
                    onChange={(e) => handleChange("previewFile", e.target.value)}
                    placeholder="URL file hoặc chọn file tải lên..."
                  />
                  <Input 
                    type="file" 
                    className="w-[150px]"
                    onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (!file || !token) return;
                       toast({ title: "Đang tải lên...", description: "Đang xử lý tải lên file xem trước." });
                       try {
                          const media = await uploadFile(file, token, 'documents');
                          handleChange("previewFile", media.url);
                          toast({ title: "Tải lên thành công" });
                       } catch(err: any) {
                          toast({ title: "Tải lên thất bại", description: err.message, variant: "destructive" });
                       } finally {
                          e.target.value = "";
                       }
                    }} 
                  />
                </div>
        );
    }

    // 6. Modify previewImages Textarea
    const previewImagesRegex = /<Textarea[\s\S]*?id="previewImages"[\s\S]*?onChange=\{\(e\) => handleChange\("previewImages", e\.target\.value\)\}[\s\S]*?\/>/;
    if (previewImagesRegex.test(content)) {
        content = content.replace(
            previewImagesRegex,
            
                <div className="space-y-2">
                  <Textarea
                    id="previewImages"
                    value={form.previewImages}
                    onChange={(e) => handleChange("previewImages", e.target.value)}
                    placeholder="Mỗi định dạng URL trên một dòng"
                    rows={3}
                  />
                  <Input 
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                       const files = Array.from(e.target.files || []);
                       if (!files.length || !token) return;
                       toast({ title: "Đang tải lên...", description: \Đang tải lên \ ảnh.\ });
                       try {
                          const newUrls = [];
                          for (const file of files) {
                             const media = await uploadFile(file, token, 'documents');
                             newUrls.push(media.url);
                          }
                          const currentUrls = form.previewImages ? form.previewImages.split("\\n").map((u: string) => u.trim()).filter(Boolean) : [];
                          handleChange("previewImages", [...currentUrls, ...newUrls].join("\\n"));
                          toast({ title: "Tải lên thành công" });
                       } catch(err: any) {
                          toast({ title: "Tải lên thất bại", description: err.message, variant: "destructive" });
                       } finally {
                          e.target.value = "";
                       }
                    }} 
                  />
                </div>
        );
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated:', file);
});
