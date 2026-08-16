"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const PDFViewerClient = dynamic(() => import("./pdf-viewer-client"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex flex-col space-y-4 items-center justify-center bg-stone-950 text-stone-300">
      <Loader2 className="animate-spin w-10 h-10 text-primary" />
      <p className="text-stone-300 font-sans tracking-wide text-sm font-medium">
        Đang khởi tạo trình đọc sách...
      </p>
    </div>
  ),
});

interface PDFViewerWrapperProps {
  documentId?: string;
  pdfUrl?: string;
  title: string;
  isInline?: boolean;
}

export default function PDFViewerWrapper({ documentId, pdfUrl, title, isInline = false }: PDFViewerWrapperProps) {
  return <PDFViewerClient documentId={documentId} pdfUrl={pdfUrl} title={title} isInline={isInline} />;
}
