"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { AdminTopDocument } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const vndFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

interface TopDocumentsTableProps {
  documents: AdminTopDocument[];
}

export function TopDocumentsTable({ documents }: TopDocumentsTableProps) {
  const maxPurchaseCount = documents[0]?.purchaseCount ?? 1;
  const displayDocs = documents.slice(0, 20);

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-sm h-[370px] flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider text-[11px]">Tài liệu bán chạy</CardTitle>
        </CardHeader>

        <CardContent className="px-3 py-0">
          {displayDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
              <span className="text-xs">Chưa có dữ liệu bán hàng</span>
            </div>
          ) : (
            <ScrollArea className="h-[260px] pr-1 pt-1.5">
              <div className="flex flex-col gap-1.5">
                {displayDocs.map((doc, index) => (
                  <div
                    key={doc.documentId}
                    className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors px-2 rounded-md"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                      {index === 0 ? (
                        <span className="size-5 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-600 font-extrabold text-[10px] shrink-0 border border-amber-200">
                          1
                        </span>
                      ) : index === 1 ? (
                        <span className="size-5 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-600 font-extrabold text-[10px] shrink-0 border border-zinc-200">
                          2
                        </span>
                      ) : index === 2 ? (
                        <span className="size-5 rounded-full flex items-center justify-center bg-orange-50 text-orange-700 font-extrabold text-[10px] shrink-0 border border-orange-200">
                          3
                        </span>
                      ) : (
                        <span className="size-5 rounded-full flex items-center justify-center bg-muted text-muted-foreground font-semibold text-[10px] shrink-0 border border-border/50">
                          {index + 1}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <Link
                          href={`/documents/${doc.slug}`}
                          className="truncate text-xs font-bold text-foreground hover:underline hover:text-primary transition-colors"
                        >
                          {doc.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1.5 w-full max-w-[200px]">
                          <Progress
                            value={(doc.purchaseCount / maxPurchaseCount) * 100}
                            className="h-1 bg-muted shrink-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-1">
                      <span className="text-xs font-bold text-foreground tabular-nums">
                        {doc.purchaseCount} lượt mua
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums mt-0.5 font-medium">
                        {vndFormat.format(doc.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </div>

      <CardFooter className="justify-center border-t border-border/40 py-2">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground">
          <Link href="/admin/documents">
            Xem kho tài liệu
            <ArrowRight className="size-3.5 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
