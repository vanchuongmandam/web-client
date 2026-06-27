"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFViewerClient({ documentId, title }: { documentId: string; title: string }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfData, setPdfData] = useState<Blob | null>(null);
  const [loadingFile, setLoadingFile] = useState(true);

  // Prevent right click & shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+P, Ctrl+S, Ctrl+C, F12
      if (e.ctrlKey || e.metaKey) {
        if (['p', 's', 'c', 'u'].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }
      if (e.key === 'F12') {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      toast({ title: "Chưa đăng nhập", description: "Bạn cần đăng nhập để xem tài liệu này.", variant: "destructive" });
      router.push('/login');
      return;
    }
    
    let active = true;

    const fetchStream = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/documents/${documentId}/view-stream`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error("Không thể tải tài liệu. Vui lòng kiểm tra lại quyền mua hoặc truy cập.");
        }
        const blob = await res.blob();
        if (active) {
          setPdfData(blob);
        }
      } catch (e: any) {
        if (active) {
          toast({ title: "Lỗi tải tài liệu", description: e.message, variant: "destructive" });
          router.back();
        }
      } finally {
        if (active) {
          setLoadingFile(false);
        }
      }
    };
    
    fetchStream();

    return () => {
      active = false;
    };
  }, [documentId, token, isLoading]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1));
  };

  if (isLoading || loadingFile) {
    return (
      <div className="h-screen w-full flex flex-col space-y-4 items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
        <p className="text-zinc-400">Đang thiết lập luồng kết nối bảo mật...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col select-none">
      {/* Toolbar */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 text-zinc-100 shadow-xl z-10">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </Button>
          <h1 className="font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg">{title}</h1>
        </div>
        
        <div className="hidden sm:flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
            <ZoomOut className="w-5 h-5" />
          </Button>
          <span className="text-sm font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(3, s + 0.2))} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
            <ZoomIn className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-zinc-800 rounded-md px-2 py-1">
            <Button variant="ghost" size="sm" onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="h-8 text-zinc-300 hover:text-white hover:bg-zinc-700">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2 tabular-nums">
              {pageNumber} / {numPages || '-'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => changePage(1)} disabled={pageNumber >= (numPages || 1)} className="h-8 text-zinc-300 hover:text-white hover:bg-zinc-700">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-auto bg-zinc-950 flex justify-center py-6 relative">
        {pdfData && (
          <Document
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<Loader2 className="animate-spin w-8 h-8 text-zinc-500 mt-20" />}
            className="shadow-2xl flex flex-col items-center"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              className="bg-white border-none shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            />
          </Document>
        )}
      </div>
      
      {/* Watermark overlay to deter screenshots */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.02] overflow-hidden mix-blend-overlay z-50">
        <div className="transform -rotate-45 text-4xl font-black text-white whitespace-pre space-y-12 w-[200%] text-center leading-[6rem] select-none">
          {Array(30).fill("VĂN CHƯƠNG MẠN ĐÀM - ĐỌC ONLINE\n").join("")}
        </div>
      </div>
    </div>
  );
}
