"use client";

import Link from "next/link";
import type { MarketDocument } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, ShoppingBag, Star, FileText } from "lucide-react";

const getBookCoverTheme = (docId: string) => {
  let sum = 0;
  for (let i = 0; i < (docId?.length || 0); i++) {
    sum += docId.charCodeAt(i);
  }
  const themes = [
    { bg: "bg-category-brown", text: "text-pastel-warm" },
    { bg: "bg-wine-deepest", text: "text-pastel-pink" },
    { bg: "bg-category-purple-dark", text: "text-pastel-purple" },
    { bg: "bg-category-blue-dark", text: "text-pastel-blue" },
    { bg: "bg-warm-sand", text: "text-earth-dark" },
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

export function HomeDocumentCard({ doc }: { doc: MarketDocument }) {
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

  return (
    <Card className="overflow-hidden flex flex-col group h-full border border-border/80 bg-card hover:border-primary/50 transition-colors rounded-xl shadow-xs">
      {/* Cover Image / Book representation */}
      <Link
        href={`/documents/${doc.slug}`}
        className="relative w-full aspect-[4/3] overflow-hidden bg-muted/40 border-b border-border/60 block"
      >
        {coverImg ? (
          <img
            src={coverImg}
            alt={doc.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden transition-transform duration-300 group-hover:scale-103">
            <div
              className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-3 justify-between relative`}
            >
              {/* Spine crease shadow */}
              <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10" />

              <div className="border border-current/20 rounded p-1.5 flex-1 flex flex-col justify-between items-center text-center relative">
                <span className="text-[8px] uppercase tracking-wider font-semibold opacity-80 truncate max-w-full">
                  {doc.category?.name || "TÀI LIỆU"}
                </span>

                <div className="my-auto py-1">
                  <h4 className="font-bold text-xs leading-tight line-clamp-3 text-center px-1">
                    {doc.title}
                  </h4>
                  <div className="w-6 h-[0.5px] bg-current opacity-30 mx-auto my-1.5" />
                  <p className="text-[9px] italic opacity-85 line-clamp-1">
                    {doc.author || "Văn Chương Mạn Đàm"}
                  </p>
                </div>

                <div className="w-full flex items-center justify-between text-[8px] opacity-80 pt-1 border-t border-current/10 font-sans">
                  <span>{(doc.fileFormat || "PDF").toUpperCase()}</span>
                  {doc.pageCount ? <span>{doc.pageCount} trang</span> : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </Link>

      {/* Card Content details */}
      <CardContent className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {doc.category?.name && (
            <Badge variant="secondary" className="mb-1.5 text-[10px] px-1.5 py-0 rounded-sm font-normal">
              {doc.category.name}
            </Badge>
          )}
          <Link href={`/documents/${doc.slug}`} className="block">
            <h3
              className="font-bold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug"
              title={doc.title}
            >
              {doc.title}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">
            Tác giả: {doc.author || "Khuyết danh"}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {doc.viewCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <strong className="text-foreground">
              {doc.rating?.average > 0
                ? doc.rating.average.toFixed(1)
                : "5.0"}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            {doc.isFree ? (
              <>
                <Download className="w-3.5 h-3.5" /> {doc.purchaseCount || 0}
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" /> {doc.purchaseCount || 0}
              </>
            )}
          </span>
        </div>
      </CardContent>

      {/* Card Footer pricing */}
      <CardFooter className="p-3.5 pt-0 border-t border-border/40 bg-muted/20 text-xs">
        <div className="w-full pt-2.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Ấn phí
          </span>
          <span
            className={`text-sm font-bold tracking-tight ${
              doc.isFree ? "text-primary" : "text-destructive font-extrabold"
            }`}
          >
            {formatPrice(doc.price)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
