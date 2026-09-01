"use client";
import { toErrorMessage } from "@/lib/errors";

import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAuthStore } from "@/stores/auth.store";
import { useReaderStore, type ReaderTheme } from "@/stores/reader.store";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Maximize2,
  Minimize2,
  BookOpen,
  Eye,
  EyeOff,
  Palette,
  Check,
  Expand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure local PDF.js worker (Zero CDN dependency)
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

type ThemeName = ReaderTheme;

interface ThemeConfig {
  name: ThemeName;
  label: string;
  bg: string;
  workspace: string;
  text: string;
  toolbar: string;
  card: string;
  divider: string;
  badge: string;
  accentBtn: string;
  activeBtn: string;
}

const THEMES: Record<ThemeName, ThemeConfig> = {
  parchment: {
    name: "parchment",
    label: "Giấy cổ",
    bg: "bg-warm-cream text-earth-dark",
    workspace: "bg-warm-ivory",
    text: "text-earth-dark",
    toolbar: "bg-warm-cream/95 border-sand-light text-earth-dark",
    card: "bg-white border-sand-light shadow-sm",
    divider: "border-sand-light",
    badge: "bg-warm-linen text-primary border-sand-dark",
    accentBtn: "hover:bg-warm-linen text-earth-dark/80 hover:text-primary",
    activeBtn: "bg-warm-linen text-primary font-semibold",
  },
  sepia: {
    name: "sepia",
    label: "Hoài cổ",
    bg: "bg-warm-linen text-earth-dark",
    workspace: "bg-warm-sand",
    text: "text-earth-dark",
    toolbar: "bg-warm-linen/95 border-sand text-earth-dark",
    card: "bg-warm-cream border-sand shadow-sm",
    divider: "border-sand",
    badge: "bg-sand text-category-copper border-sand",
    accentBtn: "hover:bg-sand text-earth-dark/80 hover:text-category-copper",
    activeBtn: "bg-sand text-category-copper font-semibold",
  },
  dark: {
    name: "dark",
    label: "Đọc đêm",
    bg: "bg-viewer-dark text-gold-light",
    workspace: "bg-viewer-dark",
    text: "text-gold-light",
    toolbar: "bg-viewer-dark/95 border-viewer-dark-border text-gold-light",
    card: "bg-viewer-dark-surface border-viewer-dark-border shadow-sm",
    divider: "border-viewer-dark-border",
    badge: "bg-viewer-dark-border text-sage-text border-viewer-dark-border",
    accentBtn: "hover:bg-viewer-dark-surface text-gold-light/80 hover:text-sage-text",
    activeBtn: "bg-viewer-dark-surface text-sage-text font-semibold",
  },
};

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

interface PDFViewerClientProps {
  documentId?: string;
  pdfUrl?: string;
  title: string;
  isInline?: boolean;
}

export default function PDFViewerClient({
  documentId,
  pdfUrl,
  title,
  isInline = false,
}: PDFViewerClientProps) {
  const token = useAuthStore((s) => s.token);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const { toast } = useToast();

  const theme = useReaderStore((s) => s.theme);
  const setTheme = useReaderStore((s) => s.setTheme);
  const scale = useReaderStore((s) => s.scale);
  const setScale = useReaderStore((s) => s.setScale);
  const zoomIn = useReaderStore((s) => s.zoomIn);
  const zoomOut = useReaderStore((s) => s.zoomOut);
  const saveLastReadPage = useReaderStore((s) => s.saveLastReadPage);

  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [inputPage, setInputPage] = useState<string>("1");
  const [pdfData, setPdfData] = useState<Blob | null>(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [isPageRendering, setIsPageRendering] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  // Baseline width (in PDF points at scale 1) of the current page — used to
  // compute an accurate "fit to width" scale for any page size.
  const pageBaseWidthRef = useRef(595);

  // References for keyboard shortcut performance
  const stateRef = useRef({
    numPages: 0,
    pageNumber: 1,
    scale: 1.0,
    isZenMode: false,
  });

  useEffect(() => {
    stateRef.current = {
      numPages: numPages || 0,
      pageNumber,
      scale,
      isZenMode,
    };
  }, [numPages, pageNumber, scale, isZenMode]);

  const changePage = useCallback((offset: number) => {
    setPageNumber((prev) => {
      const max = stateRef.current.numPages || 1;
      const next = Math.min(Math.max(1, prev + offset), max);
      setInputPage(String(next));
      return next;
    });
  }, []);

  const jumpToPage = useCallback((page: number) => {
    const max = stateRef.current.numPages || 1;
    const target = Math.min(Math.max(1, page), max);
    setPageNumber(target);
    setInputPage(String(target));
  }, []);

  const fitToWidth = useCallback(() => {
    const el = viewerContainerRef.current;
    if (!el) return;
    // Available width = container minus its own horizontal padding plus the
    // page wrapper's p-1 (8px) and 1px border on each side, so the page never
    // overflows the visible area.
    const cs = getComputedStyle(el);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const containerWidth = el.clientWidth - padX - 10;
    // Use the real page width (PDF points at scale 1) so the scale fits the
    // page to the container regardless of the document's page size.
    const baseWidth = pageBaseWidthRef.current || 595;
    const calculatedScale = Math.min(2.5, Math.max(0.6, containerWidth / baseWidth));
    setScale(parseFloat(calculatedScale.toFixed(2)));
    toast({ title: "Đã vừa khung màn hình", description: `Thu phóng: ${Math.round(calculatedScale * 100)}%` });
  }, [toast, setScale]);

  // Global Shortcuts & Right Click Protection (Attached ONCE)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print, Save, Copy, View Source
      if (e.ctrlKey || e.metaKey) {
        if (["p", "s", "c", "u"].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }
      if (e.key === "F12") {
        e.preventDefault();
      }

      // Ignore navigation shortcuts when user is typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Navigation Shortcuts: Right / Left / D / A
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        changePage(1);
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        changePage(-1);
      }

      // Zoom Shortcuts: + / = / -
      if (e.key === "=" || e.key === "+") {
        useReaderStore.getState().zoomIn();
      }
      if (e.key === "-" || e.key === "_") {
        useReaderStore.getState().zoomOut();
      }

      // Zen Mode Shortcut (Z key)
      if (e.key.toLowerCase() === "z") {
        setIsZenMode((prev) => !prev);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [changePage]);

  // Fullscreen support
  const toggleFullscreen = useCallback(() => {
    if (!rootRef.current) return;
    if (!document.fullscreenElement) {
      rootRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => {
        toast({ title: "Lỗi toàn màn hình", description: toErrorMessage(err), variant: "destructive" });
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, [toast]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Fetch document stream
  useEffect(() => {
    if (isAuthLoading) return;
    let active = true;

    const fetchStream = async () => {
      setLoadingFile(true);
      try {
        const fetchUrl = pdfUrl || `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/documents/${documentId}/view-stream`;
        const isInternalApi = fetchUrl.includes("/api/") || (!fetchUrl.startsWith("http://") && !fetchUrl.startsWith("https://"));
        const headers: HeadersInit = {};
        if (token && isInternalApi) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(fetchUrl, Object.keys(headers).length > 0 ? { headers } : undefined);

        if (!res.ok) {
          throw new Error("Không thể tải tài liệu. Vui lòng kiểm tra lại quyền truy cập.");
        }
        const blob = await res.blob();
        if (active) {
          setPdfData(blob);
        }
      } catch (e) {
        if (active) {
          toast({ title: "Lỗi tải tài liệu", description: toErrorMessage(e), variant: "destructive" });
          if (!isInline) router.back();
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
  }, [documentId, pdfUrl, token, isAuthLoading, isInline, router, toast]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    const lastPage = documentId ? useReaderStore.getState().getLastReadPage(documentId) : 1;
    const startPage = lastPage >= 1 && lastPage <= numPages ? lastPage : 1;
    setPageNumber(startPage);
    setInputPage(String(startPage));
  }, [documentId]);

  // Persist the current page whenever the reader advances
  useEffect(() => {
    if (documentId && pageNumber >= 1) {
      saveLastReadPage(documentId, pageNumber);
    }
  }, [documentId, pageNumber, saveLastReadPage]);

  const handlePageJumpInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsed = parseInt(inputPage, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= (numPages || 1)) {
        jumpToPage(parsed);
      } else {
        setInputPage(String(pageNumber));
      }
    }
  };

  const currentTheme = THEMES[theme];

  // Helper Tooltip Button Component
  const TooltipIconButton = ({
    children,
    tooltip,
    onClick,
    disabled = false,
    className = "",
    variant = "ghost",
  }: {
    children: React.ReactNode;
    tooltip: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    variant?: "ghost" | "outline" | "secondary" | "default";
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          disabled={disabled}
          onClick={onClick}
          className={cn("h-8 w-8 rounded-full transition-all duration-200", currentTheme.accentBtn, className)}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-sans text-xs bg-viewer-dark-surface text-warm-cream border-viewer-dark-border">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  if (isAuthLoading || loadingFile) {
    return (
      <div
        className={cn(
          "w-full flex flex-col space-y-4 items-center justify-center bg-viewer-dark text-earth-light",
          isInline ? "h-[min(640px,78vh)] rounded-xl border border-viewer-dark-border" : "h-screen"
        )}
      >
        <Loader2 className="animate-spin w-9 h-9 text-primary" />
        <div className="text-center space-y-1">
          <p className="text-sm font-sans text-earth-light font-medium tracking-wide">
            Đang khởi tạo trình đọc sách...
          </p>
          <p className="text-xs text-earth-light/70 font-sans italic">
            Tải dữ liệu an toàn & tối ưu hóa hiển thị
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={rootRef}
        className={cn(
          "select-none transition-colors duration-300 overflow-hidden flex flex-col font-sans",
          currentTheme.bg,
          isInline && !isFullscreen
            ? "relative w-full h-[min(640px,78vh)] rounded-xl border shadow-sm"
            : "fixed inset-0 z-50"
        )}
      >
        {/* Top Header / Toolbar */}
        <Collapsible open={!isZenMode} className="w-full shrink-0 z-30">
          <CollapsibleContent className="transition-all duration-300 ease-in-out data-[state=closed]:h-0 data-[state=open]:h-16 overflow-hidden">
            <header className={cn("h-16 border-b flex items-center justify-between px-4 sm:px-6 backdrop-blur-md", currentTheme.toolbar)}>
              {/* Left Action Area */}
              <div className="flex items-center space-x-2.5 min-w-0">
                {!isInline && (
                  <TooltipIconButton tooltip="Quay lại" onClick={() => router.back()}>
                    <X className="w-4.5 h-4.5" />
                  </TooltipIconButton>
                )}
                {!isInline && <div className={cn("h-5 w-px hidden sm:block", currentTheme.divider)} />}

                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <BookOpen className="w-4 h-4 hidden sm:block opacity-60 shrink-0 text-primary" />
                  <h1 className="font-sans font-semibold text-sm sm:text-base truncate" title={title}>
                    {title}
                  </h1>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Theme Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={cn("h-8 gap-1.5 px-2.5 rounded-full text-xs font-sans", currentTheme.accentBtn)}>
                      <Palette className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">{currentTheme.label}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="font-sans text-xs w-36">
                    <DropdownMenuLabel>Tông màu đọc</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(Object.keys(THEMES) as ThemeName[]).map((t) => (
                      <DropdownMenuItem
                        key={t}
                        onClick={() => setTheme(t)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span>{THEMES[t].label}</span>
                        {theme === t && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Zen Mode Button */}
                <TooltipIconButton tooltip="Chế độ tập trung (Z)" onClick={() => setIsZenMode(true)}>
                  <Eye className="w-4 h-4" />
                </TooltipIconButton>

                {/* Fullscreen Button */}
                <TooltipIconButton
                  tooltip={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </TooltipIconButton>
              </div>
            </header>
          </CollapsibleContent>
        </Collapsible>

        {/* Main Canvas Workspace */}
        <main
          ref={viewerContainerRef}
          className={cn(
            "flex-1 overflow-auto flex justify-center py-6 px-3 sm:px-6 relative transition-colors duration-300 z-0",
            currentTheme.workspace
          )}
        >
          {pdfData && (
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center justify-center space-y-3 mt-20">
                  <Loader2 className="animate-spin w-8 h-8 text-primary" />
                  <p className="font-sans text-xs italic opacity-70">Đang hiển thị tài liệu...</p>
                </div>
              }
              className="flex flex-col items-center max-w-full"
            >
              <div
                className={cn(
                  "relative p-1 rounded-lg transition-transform duration-200 ease-out",
                  currentTheme.card
                )}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onRenderSuccess={() => setIsPageRendering(false)}
                  onLoadSuccess={(page) => {
                    const base = page.getViewport({ scale: 1 }).width;
                    pageBaseWidthRef.current = base > 0 ? base : pageBaseWidthRef.current;
                  }}
                  className="bg-white rounded overflow-hidden"
                />
              </div>
            </Document>
          )}
        </main>

        {/* Floating Bottom Navigation Bar */}
        <nav
          aria-label="Điều hướng trang tài liệu"
          className={cn(
            "absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 px-4 py-2 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300",
            currentTheme.toolbar,
            isZenMode ? "translate-y-[150%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
          )}
        >
            {/* Pagination Navigation */}
            <div className={cn("flex items-center space-x-1.5 border-r pr-3", currentTheme.divider)}>
              <TooltipIconButton
                tooltip="Trang trước (A / ←)"
                disabled={pageNumber <= 1}
                onClick={() => changePage(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </TooltipIconButton>

              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={inputPage}
                  onChange={(e) => setInputPage(e.target.value)}
                  onKeyDown={handlePageJumpInput}
                  onBlur={() => setInputPage(String(pageNumber))}
                  className={cn(
                    "w-9 h-7 text-center text-xs font-sans font-bold rounded border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary",
                    currentTheme.divider
                  )}
                  aria-label="Số trang hiện tại"
                />
                <span className="text-xs opacity-75 font-medium">/ {numPages || "-"}</span>
              </div>

              <TooltipIconButton
                tooltip="Trang sau (D / →)"
                disabled={pageNumber >= (numPages || 1)}
                onClick={() => changePage(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </TooltipIconButton>
            </div>

            {/* Quick Slider Page Scrubber */}
            {numPages && numPages > 1 && (
              <div className="w-20 sm:w-28 hidden xs:flex items-center px-1">
                <Slider
                  value={[pageNumber]}
                  min={1}
                  max={numPages}
                  step={1}
                  onValueChange={(val) => jumpToPage(val[0])}
                  className="cursor-pointer"
                />
              </div>
            )}

            {/* Zoom & Fit Controls */}
            <div className={cn("flex items-center space-x-1.5 border-l pl-3", currentTheme.divider)}>
              <TooltipIconButton
                tooltip="Thu nhỏ (-)"
                disabled={scale <= 0.5}
                onClick={zoomOut}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </TooltipIconButton>

              {/* Zoom Presets Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "text-xs font-sans font-bold px-1.5 py-1 rounded transition-colors text-center min-w-[50px]",
                      currentTheme.accentBtn
                    )}
                  >
                    {Math.round(scale * 100)}%
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="font-sans text-xs w-36">
                  <DropdownMenuItem onClick={fitToWidth} className="gap-2 cursor-pointer">
                    <Expand className="w-3.5 h-3.5" /> Vừa chiều rộng
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {ZOOM_PRESETS.map((preset) => (
                    <DropdownMenuItem
                      key={preset}
                      onClick={() => setScale(preset)}
                      className="flex justify-between cursor-pointer"
                    >
                      <span>{Math.round(preset * 100)}%</span>
                      {scale === preset && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipIconButton
                tooltip="Phóng to (+)"
                disabled={scale >= 2.5}
                onClick={zoomIn}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </TooltipIconButton>
            </div>
          </nav>

        {/* Floating Zen Mode Exit Control */}
        {isZenMode && (
          <Button
            size="sm"
            onClick={() => setIsZenMode(false)}
            className="fixed top-5 right-5 z-40 rounded-full shadow-sm gap-1.5 text-xs font-sans bg-viewer-dark-surface/90 text-warm-cream hover:bg-viewer-dark-surface border border-viewer-dark-border"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Thoát tập trung (Z)</span>
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
