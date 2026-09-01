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
      <DialogContent className="max-w-md gap-0 border-2 border-sand bg-warm-cream rounded-xl p-0 shadow-sm overflow-hidden">
        <DialogHeader className="border-b border-sand-light bg-warm-ivory/70 px-6 py-5">
          <DialogTitle className="font-sans text-lg font-bold text-earth">
            Liên hệ nhận tài liệu
          </DialogTitle>
          <DialogDescription className="text-xs text-earth-muted">
            Trao đổi trực tiếp với {displayName} qua Zalo.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Document summary */}
          <div className="flex items-center gap-3 rounded-lg border border-sand-light bg-warm-ivory/40 p-3">
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-sand-light bg-white">
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
              <p className="truncate text-sm font-semibold text-earth" title={document.title}>
                {document.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-earth-muted">
                Tác giả: {document.author || "Khuyết danh"}
              </p>
              <Badge variant="outline" className="mt-1.5 rounded-sm border-sand text-[10px] font-semibold text-primary">
                Trao đổi liên hệ
              </Badge>
            </div>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center">
            <div className="rounded-lg border-2 border-sand bg-white p-4">
              {zaloLink ? (
                <QRCodeSVG value={zaloLink} size={184} level="M" marginSize={1} />
              ) : (
                <div className="flex h-[184px] w-[184px] items-center justify-center text-xs text-earth-muted">
                  Chưa cấu hình số Zalo
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] text-earth-muted">
              Quét mã bằng ứng dụng Zalo trên điện thoại
            </p>
          </div>

          {/* Phone + copy */}
          <div className="flex items-center justify-between gap-2 rounded-md border border-sand bg-warm-ivory/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-earth-light">Số Zalo</p>
              <p className="text-lg font-bold text-primary">{phone || "—"}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 border-sand bg-warm-cream text-xs font-semibold text-earth hover:text-primary"
              onClick={handleCopy}
              disabled={!phone}
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              {copied ? "Đã sao chép" : "Sao chép số"}
            </Button>
          </div>

          <div className="space-y-2.5">
            <Button
              type="button"
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-wine-dark rounded-md font-semibold"
              size="lg"
              onClick={handleOpenZalo}
              disabled={!zaloLink}
            >
              <MessageCircle className="size-4" />
              Mở ứng dụng Zalo
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-earth-muted">
              Mở ứng dụng Zalo trên điện thoại để quét mã QR hoặc bấm nút phía trên để nhắn tin trao đổi trực tiếp.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
