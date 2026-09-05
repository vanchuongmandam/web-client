"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { ContactSettings, MarketDocument } from "@/lib/types";
import { getMediaUrl } from "@/lib/utils";
import { getBookCoverTheme } from "@/lib/document-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, MessageCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: MarketDocument;
  contactSettings: ContactSettings;
}

export function ContactDocumentDialog({ open, onOpenChange, document, contactSettings }: Props) {
  const [copied, setCopied] = useState(false);

  const phone = (document.contactPhone?.trim() || contactSettings.phone || "").trim();
  const zaloLink = phone ? `https://zalo.me/${phone}` : null;
  const displayName = contactSettings.zaloName || "Ban Quản Trị VCMD";

  const coverImg = useMemo(
    () =>
      document.coverImage?.trim() ||
      (Array.isArray(document.previewImages) && document.previewImages.length > 0
        ? document.previewImages[0]
        : null),
    [document.coverImage, document.previewImages]
  );

  const theme = useMemo(() => getBookCoverTheme(document._id), [document._id]);

  const handleCopy = async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleOpenZalo = () => {
    if (zaloLink) window.open(zaloLink, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-xl md:max-w-[620px] max-h-[min(92dvh,640px)] flex flex-col grid-rows-[auto,1fr] p-0 gap-0 border-2 border-sand bg-warm-cream rounded-xl shadow-sm overflow-hidden">
        <DialogHeader className="shrink-0 border-b border-sand-light bg-warm-ivory/70 px-5 py-3.5 sm:px-6 sm:py-4 pr-12">
          <DialogTitle className="font-sans text-base sm:text-lg font-bold text-earth">
            Liên hệ nhận tài liệu
          </DialogTitle>
          <DialogDescription className="text-xs text-earth-muted">
            Trao đổi trực tiếp với {displayName} qua Zalo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* Left column: Document info + Phone + Action */}
            <div className="flex flex-col justify-between space-y-3 sm:space-y-3.5">
              {/* Document summary */}
              <div className="flex items-center gap-3 rounded-lg border border-sand-light bg-warm-ivory/60 p-2.5 sm:p-3">
                <div className="relative h-14 w-11 sm:h-16 sm:w-12 shrink-0 overflow-hidden rounded-md border border-sand-light bg-white shadow-2xs">
                  {coverImg ? (
                    <Image
                      src={getMediaUrl(coverImg)}
                      alt={document.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center ${theme.bg} ${theme.text}`}>
                      <span className="text-[8px] font-semibold uppercase tracking-wider opacity-80">
                        {document.fileFormat?.toUpperCase() || "PDF"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs sm:text-sm font-semibold text-earth leading-snug" title={document.title}>
                    {document.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] sm:text-xs text-earth-muted">
                    Tác giả: {document.author || "Khuyết danh"}
                  </p>
                  <Badge variant="outline" className="mt-1 rounded-sm border-sand text-[10px] font-medium text-primary bg-primary/5">
                    Trao đổi liên hệ
                  </Badge>
                </div>
              </div>

              {/* Phone + copy */}
              <div className="flex items-center justify-between gap-2 rounded-md border border-sand bg-warm-ivory/80 px-3.5 py-2.5 sm:px-4 sm:py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-earth-light">Số Zalo liên hệ</p>
                  <p className="text-base sm:text-lg font-bold text-primary tracking-wide">{phone || "—"}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 border-sand bg-warm-cream text-xs font-semibold text-earth hover:text-primary hover:bg-warm-sand"
                  onClick={handleCopy}
                  disabled={!phone}
                >
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
                </Button>
              </div>

              {/* Zalo CTA button */}
              <div className="space-y-1.5">
                <Button
                  type="button"
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-wine-dark rounded-md font-semibold text-xs sm:text-sm h-10 sm:h-11 shadow-xs"
                  size="lg"
                  onClick={handleOpenZalo}
                  disabled={!zaloLink}
                >
                  <MessageCircle className="size-4 shrink-0" />
                  <span>Mở ứng dụng Zalo</span>
                </Button>
                <p className="text-center sm:text-left text-[10.5px] leading-relaxed text-earth-muted">
                  Bấm nút để nhắn tin trực tiếp hoặc sao chép số để tìm kiếm trên Zalo.
                </p>
              </div>
            </div>

            {/* Visual divider for mobile only */}
            <div className="relative my-0.5 flex items-center justify-center sm:hidden">
              <div className="w-full border-t border-sand-light" />
              <span className="absolute bg-warm-cream px-2.5 text-[10px] font-medium uppercase tracking-wider text-earth-light">
                Hoặc quét mã QR
              </span>
            </div>

            {/* Right column: QR Code card */}
            <div className="flex flex-col items-center justify-center rounded-lg border border-sand-light bg-warm-ivory/50 p-4 sm:p-5 text-center">
              <div className="rounded-md border-2 border-sand bg-white p-2.5 sm:p-3 shadow-xs inline-flex items-center justify-center">
                {zaloLink ? (
                  <QRCodeSVG
                    value={zaloLink}
                    size={154}
                    level="M"
                    marginSize={1}
                    className="w-[124px] h-[124px] sm:w-[154px] sm:h-[154px]"
                  />
                ) : (
                  <div className="flex h-[124px] w-[124px] sm:h-[154px] sm:w-[154px] items-center justify-center text-xs text-earth-muted">
                    Chưa cấu hình số Zalo
                  </div>
                )}
              </div>
              <p className="mt-2.5 text-xs font-semibold text-earth">
                Quét mã kết nối Zalo
              </p>
              <p className="mt-0.5 text-[11px] text-earth-muted max-w-[200px] leading-snug">
                <span className="hidden sm:inline">Dùng ứng dụng Zalo trên điện thoại để quét mã kết nối ngay</span>
                <span className="sm:hidden">Dùng Zalo trên máy khác để quét hoặc chụp màn hình mã QR</span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
