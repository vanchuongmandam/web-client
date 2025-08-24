"use client";
import type { Media } from "@/lib/types";

interface ArticlePdfSectionProps {
  pdfs: Media[];
}

export default function ArticlePdfSection({ pdfs }: ArticlePdfSectionProps) {
  if (!pdfs || pdfs.length === 0) return null;
  return (
    <div className="my-8">
      <h2 className="text-xl font-semibold mb-2">Tài liệu đính kèm (PDF)</h2>
      {pdfs.map((pdf, idx) => (
        <div key={pdf.url + idx} className="mb-8 rounded-lg border shadow-sm bg-white overflow-hidden">
          <div className="w-full aspect-[16/9] bg-gray-100 flex items-center justify-center">
            <iframe
              src={`https://drive.google.com/viewer?embedded=true&url=${encodeURIComponent(pdf.url)}`}
              title={`PDF ${idx + 1}`}
              className="w-full h-full min-h-[700px] border-0 rounded-b-none"
              allowFullScreen
            />
          </div>
        </div>
      ))}
    </div>
  );
}
