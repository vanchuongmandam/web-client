// src/app/articles/[slug]/article-pdf-section.tsx

"use client";

import { toErrorMessage } from "@/lib/errors";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { instantUnlock } from '@/lib/api';
import type { Media } from "@/lib/types";
import { Lock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RequestAccessModal } from '@/components/articles/RequestAccessModal';
import dynamic from 'next/dynamic';

const PDFViewerClient = dynamic(() => import('@/components/pdf-viewer/pdf-viewer-client'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex flex-col items-center justify-center bg-card text-muted-foreground rounded-xl border">
      <Loader2 className="animate-spin w-8 h-8 text-primary mb-2" />
      <p className="font-sans text-sm italic">Đang chuẩn bị trình đọc sách...</p>
    </div>
  ),
});

interface PdfItemProps {
  pdf: Media;
  idx: number;
  articleId: string;
  articleTitle: string;
}

function PdfItem({ pdf, idx, articleId, articleTitle }: PdfItemProps) {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [isUnlockConfirmOpen, setIsUnlockConfirmOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleRequestSuccess = () => {
    router.refresh();
  };

  if (pdf.isRestricted && !pdf.accessGranted) {
    const hasPrice = pdf.unlockPrice && pdf.unlockPrice > 0;
    return (
      <div className="mb-8 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="w-full aspect-[16/9] min-h-[400px] bg-muted/20 flex flex-col items-center justify-center p-8 text-center">
          <Lock className="h-12 w-12 text-amber-600 mb-3 animate-pulse" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Tài liệu bị hạn chế (PDF #{idx + 1})
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm">
            Tài liệu PDF này được bảo vệ. Vui lòng mở khóa hoặc gửi yêu cầu để xem nội dung chi tiết.
          </p>

          {pdf.requestStatus === "pending" ? (
            <Button variant="secondary" disabled size="sm">Đang chờ duyệt</Button>
          ) : pdf.requestStatus === "rejected" ? (
            <Button variant="destructive" disabled size="sm">Yêu cầu bị từ chối</Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[360px] justify-center">
              {hasPrice && (
                <>
                  <Button 
                    onClick={() => {
                      if (!token) {
                        toast({
                          title: "Yêu cầu đăng nhập",
                          description: "Bạn cần đăng nhập để mở khóa tài liệu.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setIsUnlockConfirmOpen(true);
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold" 
                    size="sm"
                  >
                    Mở khóa ({formatPrice(pdf.unlockPrice!)})
                  </Button>
                  
                  <Dialog open={isUnlockConfirmOpen} onOpenChange={setIsUnlockConfirmOpen}>
                    <DialogContent className="sm:max-w-[420px]">
                      <DialogTitle>Xác nhận mở khóa tài liệu PDF</DialogTitle>
                      <div className="py-4 space-y-2">
                        <p className="text-sm text-slate-600 text-left">
                          Bạn có chắc chắn muốn mở khóa tài liệu PDF này không?
                        </p>
                        <div className="bg-slate-50 border p-3 rounded-md text-xs space-y-1.5 text-left">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Giá mở khóa:</span>
                            <span className="font-bold text-amber-700">{formatPrice(pdf.unlockPrice!)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Số dư hiện tại:</span>
                            <span className="font-semibold text-slate-700">{formatPrice(user?.balance || 0)}</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUnlockConfirmOpen(false)} disabled={isUnlocking}>
                          Hủy
                        </Button>
                        <Button 
                          onClick={async () => {
                            setIsUnlocking(true);
                            try {
                              await instantUnlock(articleId, pdf.url, token!);
                              toast({
                                title: "Mở khóa thành công",
                                description: "Tài liệu đã được mở khóa bằng số dư ví.",
                              });
                              setIsUnlockConfirmOpen(false);
                              handleRequestSuccess();
                            } catch (err) {
                              toast({
                                title: "Lỗi mở khóa",
                                description: toErrorMessage(err, "Không thể mở khóa tài liệu này."),
                                variant: "destructive",
                              });
                            } finally {
                              setIsUnlocking(false);
                            }
                          }} 
                          disabled={isUnlocking}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          {isUnlocking ? "Đang xử lý..." : "Mở khóa ngay"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              <RequestAccessModal
                articleId={articleId}
                articleTitle={articleTitle}
                token={token}
                onSuccess={handleRequestSuccess}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-border/70 shadow-sm bg-card overflow-hidden animate-fade-in">
      <PDFViewerClient
        pdfUrl={pdf.url}
        title={`${articleTitle} (Tài liệu #${idx + 1})`}
        isInline={true}
      />
    </div>
  );
}

interface ArticlePdfSectionProps {
  pdfs: Media[];
  articleId: string;
  articleTitle: string;
}

export default function ArticlePdfSection({ pdfs, articleId, articleTitle }: ArticlePdfSectionProps) {
  if (!pdfs || pdfs.length === 0) return null;
  return (
    <div className="my-8">
      <h2 className="text-xl font-semibold mb-3 text-primary font-sans border-b border-border/60 pb-2">Tài liệu đính kèm (PDF)</h2>
      {pdfs.map((pdf, idx) => (
        <PdfItem 
          key={pdf.url + idx} 
          pdf={pdf} 
          idx={idx} 
          articleId={articleId} 
          articleTitle={articleTitle} 
        />
      ))}
    </div>
  );
}
