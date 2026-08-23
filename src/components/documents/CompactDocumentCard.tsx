"use client";

import Link from "next/link";
import type { MarketDocument } from "@/lib/types";
import { Eye, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const getBookCoverTheme = (docId: string) => {
  let sum = 0;
  for (let i = 0; i < (docId?.length || 0); i++) {
    sum += docId.charCodeAt(i);
  }
  const themes = [
    { bg: "bg-wine-deepest", text: "text-warm-cream" },
    { bg: "bg-category-copper", text: "text-warm-cream" },
    { bg: "bg-category-purple", text: "text-warm-cream" },
    { bg: "bg-category-blue", text: "text-warm-cream" },
    { bg: "bg-earth-dark", text: "text-warm-cream" },
  ];
  return themes[sum % themes.length];
};

function formatPrice(price: number): string {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export function CompactDocumentCard({
  doc,
  isPanelItem = false,
}: {
  doc: MarketDocument;
  isPanelItem?: boolean;
}) {
  const theme = getBookCoverTheme(doc._id);
  const coverImg =
    doc.coverImage?.trim() ||
    (Array.isArray(doc.previewImages) && doc.previewImages.length > 0
      ? doc.previewImages[0]
      : null) ||
    (doc.previewFile &&
    typeof doc.previewFile === "string" &&
    doc.previewFile.trim() !== "" &&
    !doc.previewFile.toLowerCase().endsWith(".pdf") &&
    !doc.previewFile.toLowerCase().endsWith(".zip") &&
    !doc.previewFile.toLowerCase().endsWith(".docx")
      ? doc.previewFile
      : null);

  const fileFormat = (doc.fileFormat || "PDF").toUpperCase();

  return (
    <Link
      href={`/documents/${doc.slug}`}
      className={cn(
        "flex items-center gap-3.5 transition-all duration-200 group",
        isPanelItem
          ? "p-3 sm:p-3.5 hover:bg-muted/40"
          : "p-3 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs hover:-translate-y-0.5"
      )}
    >
      {/* Book Thumbnail (3:4 Proportion) */}
      <div className="w-14 h-20 sm:w-16 sm:h-22 aspect-[3/4] rounded-md overflow-hidden shrink-0 bg-muted/40 border border-border/50 relative shadow-2xs">
        {coverImg ? (
          <img
            src={coverImg}
            alt={doc.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-2 justify-between relative`}
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-r from-black/25 to-transparent" />
            <span className="text-[7px] uppercase tracking-wider font-semibold opacity-85 truncate">
              {doc.category?.name || "TÀI LIỆU"}
            </span>
            <p className="font-bold text-[8px] sm:text-[9px] leading-tight line-clamp-3 text-center my-auto px-0.5">
              {doc.title}
            </p>
            <span className="text-[7px] opacity-75 font-sans">
              {fileFormat}
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 self-stretch">
        <div>
          {doc.category?.name && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold line-clamp-1 mb-0.5 block">
              {doc.category.name}
            </span>
          )}
          <h4 className="font-bold text-sm sm:text-[15px] text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug font-sans">
            {doc.title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            Tác giả: <span className="font-medium text-foreground/80">{doc.author || "Khuyết danh"}</span>
          </p>
        </div>

        {/* Pricing & Metadata Row */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/50">
          <span
            className={cn(
              "text-xs sm:text-sm font-bold",
              doc.isFree ? "text-primary" : "text-destructive"
            )}
          >
            {formatPrice(doc.price)}
          </span>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Eye className="w-3.5 h-3.5 opacity-70" />
              <span>{doc.viewCount || 0}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>
                {doc.rating?.average > 0
                  ? doc.rating.average.toFixed(1)
                  : "5.0"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}



