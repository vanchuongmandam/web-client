"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SearchOverlay } from "@/components/search-overlay";

export function SearchButtonAndOverlay() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+K / ⌘+K to open search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsSearchOpen(true)}
        className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        title="Tìm kiếm (⌘K)"
      >
        <Search className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="sr-only">Tìm kiếm (⌘K)</span>
      </Button>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
