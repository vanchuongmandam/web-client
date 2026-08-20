"use client";

import type { PaginationMeta } from "@/lib/types";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  unit?: string;
}

export function PaginationControls({ pagination, onPageChange, isLoading, unit = 'bài' }: PaginationControlsProps) {
  const { page, totalPages, total, hasPrevPage, hasNextPage } = pagination;

  if (totalPages <= 1) return null;

  // Build visible page numbers: show at most 5 around current
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const handlePageClick = (e: React.MouseEvent, p: number) => {
    e.preventDefault();
    if (!isLoading && p !== page) {
      onPageChange(p);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 w-full">
      <div className="text-sm text-muted-foreground flex-shrink-0">
        Hiển thị trang <span className="font-medium text-foreground">{page}</span> / {totalPages} (Tổng: {total} {unit})
      </div>

      <Pagination className="justify-end w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                if (hasPrevPage && !isLoading) onPageChange(page - 1); 
              }} 
              className={(!hasPrevPage || isLoading) ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {start > 1 && (
            <>
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => handlePageClick(e, 1)}>1</PaginationLink>
              </PaginationItem>
              {start > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink 
                href="#" 
                isActive={p === page}
                onClick={(e) => handlePageClick(e, p)}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => handlePageClick(e, totalPages)}>{totalPages}</PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                if (hasNextPage && !isLoading) onPageChange(page + 1); 
              }} 
              className={(!hasNextPage || isLoading) ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

