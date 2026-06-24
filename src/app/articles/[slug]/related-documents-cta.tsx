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
    <div className="mt-8 mb-4 border-2 border-[#ebdcb9]/40 bg-[#fcf9f2] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#4c6b54]/10 p-2 rounded-lg">
          <BookOpen className="size-5 text-[#4c6b54]" />
        </div>
        <div>
          <h3 className="font-bold text-[#4c6b54] text-lg">Tài liệu đính kèm</h3>
          <p className="text-sm text-muted-foreground">Tài liệu tham khảo chuyên sâu liên quan đến bài viết này</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {documents.map((doc) => (
          <Card key={doc._id} className="overflow-hidden border-[#ebdcb9]/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="outline" className="bg-[#ebdcb9]/20 text-[#635748] border-none text-[10px] uppercase">
                      {doc.fileFormat}
                    </Badge>
                    <span className="font-bold text-[#8e2929] text-sm">{formatPrice(doc.price)}</span>
                  </div>
                  <h4 className="font-bold text-[#483d31] line-clamp-2 leading-snug mb-1">{doc.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">Tác giả: {doc.author || 'Khuyết danh'}</p>
                </div>
                <div className="bg-[#fdfaf5] p-3 border-t border-[#ebdcb9]/30 mt-auto">
                  <Button asChild className="w-full bg-[#4c6b54] text-white hover:bg-[#3b5341] font-semibold" size="sm">
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
