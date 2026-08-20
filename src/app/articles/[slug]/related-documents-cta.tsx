"use client";

import Link from "next/link";
import { BookOpen, ShoppingCart, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketDocument } from "@/lib/types";

function formatPrice(price: number): string {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export function RelatedDocumentsCTA({ documents }: { documents: MarketDocument[] }) {
  if (!documents || documents.length === 0) return null;

  return (
    <div className="mt-8 mb-4 border-2 border-sand/40 bg-warm-cream rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-forest/10 p-2 rounded-lg">
          <BookOpen className="size-5 text-forest" />
        </div>
        <div>
          <h3 className="font-bold text-forest text-lg">Tài liệu đính kèm</h3>
          <p className="text-sm text-muted-foreground">Tài liệu tham khảo chuyên sâu liên quan đến bài viết này</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {documents.map((doc) => (
          <Card key={doc._id} className="overflow-hidden border border-sand/50 rounded-xl shadow-xs hover:border-primary/50 transition-colors">
            <CardContent className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="outline" className="bg-sand/20 text-earth-muted border-none text-[10px] uppercase">
                      {doc.fileFormat}
                    </Badge>
                    <span className="font-bold text-category-red text-sm">{formatPrice(doc.price)}</span>
                  </div>
                  <h4 className="font-bold text-earth line-clamp-2 leading-snug mb-1">{doc.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">Tác giả: {doc.author || 'Khuyết danh'}</p>
                </div>
                <div className="bg-warm-cream p-3 border-t border-sand/30 mt-auto">
                  <Button asChild className="w-full bg-forest text-white hover:bg-forest-dark font-semibold" size="sm">
                    <Link href={`/documents/${doc.slug}`}>
                      {doc.price === 0 ? (
                        <><Download className="mr-2 size-3.5" /> Tải miễn phí</>
                      ) : (
                        <><ShoppingCart className="mr-2 size-3.5" /> Mua tài liệu</>
                      )}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
