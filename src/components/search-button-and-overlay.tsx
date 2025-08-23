"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SearchOverlay } from "@/components/search-overlay";

export function SearchButtonAndOverlay() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
        <Search className="h-5 w-5" />
        <span className="sr-only">Tìm kiếm</span>
      </Button>
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
