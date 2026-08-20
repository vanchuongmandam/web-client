// src/app/documents/document-list-client.tsx

"use client";

import { toErrorMessage } from "@/lib/errors";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MarketDocument, DocumentCategory, DocumentCollection, PaginationMeta } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { toggleBookmark, getBookmarks } from '@/lib/api';
import {
  FileText,
  Star,
  Eye,
  Download,
  Search,
  FilterX,
  SlidersHorizontal,
  Bookmark,
  BookOpen,
  History,
  Sparkles,
  BookMarked,
  Layers,
  Coins,
  Loader2,
  Trash2
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentListClientProps {
  initialDocuments: MarketDocument[];
  initialPagination: PaginationMeta;
  categories: DocumentCategory[];
  collections: DocumentCollection[];
  currentCategory?: string;
  currentSearch?: string;
  currentSort?: string;
  currentPage: number;
  currentTag?: string;
}

function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const sortOptions = [
  { value: '-createdAt', label: 'Ấn bản mới nhất' },
  { value: '-purchaseCount', label: 'Tải nhiều nhất' },
  { value: '-rating.average', label: 'Đánh giá cao nhất' },
  { value: 'price', label: 'Giá từ thấp đến cao' },
  { value: '-price', label: 'Giá từ cao đến thấp' },
];

// popularTags is removed since collections handles it now
// Helper to determine book cover theme dynamically
const getBookCoverTheme = (docId: string) => {
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  const themes = [
    { bg: 'bg-[#5c3e35]', text: 'text-[#f4eae1]', border: 'border-[#432d27]', tagBg: 'bg-[#432d27]/40 text-[#f4eae1]/90', lineBg: 'bg-[#a37055]' }, // Warm Mahogany
    { bg: 'bg-[#2b3a32]', text: 'text-[#e9f1e8]', border: 'border-[#1d2722]', tagBg: 'bg-[#1d2722]/40 text-[#e9f1e8]/90', lineBg: 'bg-[#526f5c]' }, // Forest Moss
    { bg: 'bg-[#3b2b3a]', text: 'text-[#f5eaf4]', border: 'border-[#261c25]', tagBg: 'bg-[#261c25]/40 text-[#f5eaf4]/90', lineBg: 'bg-[#7a5879]' }, // Dark Aubergine
    { bg: 'bg-[#1f2d3d]', text: 'text-[#e9f1f6]', border: 'border-[#131b25]', tagBg: 'bg-[#131b25]/40 text-[#e9f1f6]/90', lineBg: 'bg-[#4f6b8c]' }, // Slate Ocean
    { bg: 'bg-[#e2d6c5]', text: 'text-[#3e342a]', border: 'border-[#ccbfae]', tagBg: 'bg-[#3e342a]/15 text-[#3e342a]/95', lineBg: 'bg-[#bca68d]' }, // Vintage Parchment
  ];
  return themes[sum % themes.length];
};

export function DocumentListClient({
  initialDocuments,
  initialPagination,
  categories,
  collections,
  currentCategory,
  currentSearch,
  currentSort,
  currentPage,
  currentTag,
}: DocumentListClientProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  const [searchValue, setSearchValue] = useState(currentSearch || '');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState<string | null>(null);

  const hasActiveFilters = Boolean(currentCategory || currentSearch || currentSort || currentTag);

  // Load bookmarks and search history on client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vcmd_recent_searches');
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      getBookmarks(token, { limit: 100 })
        .then(res => {
          setBookmarkedIds(res.data.map(doc => doc._id));
        })
        .catch(err => console.error("Error loading bookmarks:", err));
    } else {
      setBookmarkedIds([]);
    }
  }, [token]);

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams();
    if (currentCategory && key !== 'category') params.set('category', currentCategory);
    if (currentSearch && key !== 'search') params.set('search', currentSearch);
    if (currentSort && key !== 'sort') params.set('sort', currentSort);
    if (currentTag && key !== 'tag') params.set('tag', currentTag);

    if (value && value !== 'All') params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/documents?${params.toString()}`);
  };

  const handleSearchSubmit = (keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed) {
      // Save to recent searches
      const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('vcmd_recent_searches', JSON.stringify(updated));
    }
    updateFilter('search', trimmed || undefined);
  };

  const handleFormSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchSubmit(searchValue);
  };

  const handleClearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('vcmd_recent_searches');
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (currentCategory) params.set('category', currentCategory);
    if (currentSearch) params.set('search', currentSearch);
    if (currentSort) params.set('sort', currentSort);
    if (currentTag) params.set('tag', currentTag);
    params.set('page', String(page));
    router.push(`/documents?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchValue('');
    router.push('/documents');
  };

  const toggleSaveDocument = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Bạn cần đăng nhập để lưu tài liệu vào Tủ sách cá nhân.",
        variant: "destructive",
      });
      return;
    }

    setIsBookmarkLoading(docId);
    try {
      const res = await toggleBookmark(docId, token);
      if (res.bookmarked) {
        setBookmarkedIds(prev => [...prev, docId]);
        toast({
          title: "Đã lưu tài liệu",
          description: "Tài liệu đã được thêm vào tủ sách cá nhân.",
        });
      } else {
        setBookmarkedIds(prev => prev.filter(id => id !== docId));
        toast({
          title: "Đã bỏ lưu",
          description: "Tài liệu đã được xóa khỏi tủ sách cá nhân.",
        });
      }
    } catch (err) {
      toast({
        title: "Thất bại",
        description: toErrorMessage(err, "Đã xảy ra lỗi khi lưu tài liệu."),
        variant: "destructive",
      });
    } finally {
      setIsBookmarkLoading(null);
    }
  };

  const FilterPanel = () => (
    <div className="flex flex-col gap-5 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#4c6b54] flex items-center gap-2">
          <SlidersHorizontal className="size-4" /> Tinh chỉnh kết quả
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-[#8e2929] hover:text-[#8e2929]/80 hover:bg-transparent p-0 h-auto">
            <FilterX className="mr-1 size-3.5" /> Xóa lọc
          </Button>
        )}
      </div>

      <Separator className="bg-border/60" />

      {/* Categories Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#5a5045] flex items-center gap-1.5">
          <Layers className="size-3.5 text-[#888072]" /> Chuyên mục tài liệu
        </label>
        <Select
          value={currentCategory || 'all'}
          onValueChange={(v) => updateFilter('category', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full bg-[#fcf9f2] border-2 border-[#ebdcb9] hover:border-primary/45 rounded-md h-10 transition-colors text-xs font-medium">
            <SelectValue placeholder="Tất cả chuyên mục" />
          </SelectTrigger>
          <SelectContent className="bg-[#fcf9f2] border-[#ebdcb9]">
            <SelectItem value="all">Tất cả chuyên mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Collections Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#5a5045] flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-[#888072]" /> Bộ sưu tập đề thi
        </label>
        <Select
          value={currentTag || 'all'}
          onValueChange={(v) => updateFilter('tag', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full bg-[#fcf9f2] border-2 border-[#ebdcb9] hover:border-primary/45 rounded-md h-10 transition-colors text-xs font-medium">
            <SelectValue placeholder="Tất cả chuyên đề thi" />
          </SelectTrigger>
          <SelectContent className="bg-[#fcf9f2] border-[#ebdcb9]">
            <SelectItem value="all">Tất cả chuyên đề thi</SelectItem>
            {collections.map((col) => (
              <SelectItem key={col.slug} value={col.slug}>
                {col.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 bg-background">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumb className="font-sans">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="hover:text-primary transition-colors">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#483d31] font-semibold">Tủ sách Tài liệu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 1. LITERARY HERO SECTION */}
      <div className="mb-10 text-center md:text-left relative py-8 px-6 md:px-10 rounded-md bg-gradient-to-br from-[#f6ecd9] to-[#ebdcb9] border-2 border-[#e6d0a7]/60 overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ebdcb9] opacity-30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#4c6b54] leading-tight">
              Tủ Sách Tài Liệu
            </h1>
            <p className="mt-3 text-[#6e6353] font-medium italic text-base leading-relaxed">
              &ldquo;Nơi gìn giữ và chia sẻ những ấn phẩm văn chương chọn lọc, chuyên đề lý luận chuyên sâu cùng các đề thi tốt nghiệp, học sinh giỏi quốc gia đạt chuẩn học thuật.&rdquo;
            </p>

            {/* Quick Collections Chips */}
            <div className="mt-6 flex flex-wrap justify-center md:justify-start items-center gap-2 font-sans">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7e6c] mr-1">Bộ sưu tập:</span>
              <Button
                size="sm"
                variant={!currentTag ? "default" : "outline"}
                className={`h-7 px-3 text-xs rounded-md border border-primary/20 ${!currentTag ? 'bg-[#4c6b54] text-[#f7eaf0] hover:bg-[#3b5341]' : 'bg-[#fcf9f2] text-foreground hover:bg-[#ebdcb9]/40'}`}
                onClick={() => updateFilter('tag', undefined)}
              >
                Tất cả
              </Button>
              {collections.slice(0, 4).map((tag) => (
                <Button
                  key={tag.slug}
                  size="sm"
                  variant={currentTag === tag.slug ? "default" : "outline"}
                  className={`h-7 px-3 text-xs rounded-md border border-primary/20 transition-all ${currentTag === tag.slug ? 'bg-[#4c6b54] text-[#f7eaf0] hover:bg-[#3b5341] font-semibold' : 'bg-[#fcf9f2] text-foreground hover:bg-[#ebdcb9]/40'}`}
                  onClick={() => updateFilter('tag', currentTag === tag.slug ? undefined : tag.slug)}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Elegant Stats Card */}
          <div className="flex flex-row md:flex-col gap-4 shrink-0 bg-[#fbf7ee] p-5 rounded-md border border-[#ebdcb9] shadow-sm font-sans w-full md:w-auto">
            <div className="flex-1 text-center md:text-left min-w-[100px]">
              <p className="text-2xl font-black text-[#4c6b54] tracking-tight">{initialPagination.total || 0}</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">Tác phẩm</p>
            </div>
            <div className="hidden md:block border-t border-border/60 my-1"></div>
            <div className="flex-1 text-center md:text-left min-w-[100px]">
              <p className="text-2xl font-black text-[#a06b4c] tracking-tight">12.4K+</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">Lượt tải</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. POWERFUL SEARCH AREA */}
      <div className="mb-8 font-sans max-w-4xl mx-auto">
        <form onSubmit={handleFormSearch} className="relative flex items-center w-full shadow-sm hover:shadow-sm transition-shadow rounded-md overflow-hidden border-2 border-[#ebdcb9] focus-within:border-primary/60 bg-[#fcf9f2]">
          <div className="pointer-events-none absolute inset-y-0 text-muted-foreground left-0 pl-4 flex items-center">
            <Search className="size-5 text-[#8c7e6c]" />
          </div>
          <Input
            placeholder="Tìm kiếm tác phẩm, tác giả hoặc chuyên đề ôn thi bạn cần..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-12 pr-28 h-14 text-base rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#a69888]"
          />
          <Button type="submit" className="absolute right-1.5 h-11 px-5 rounded-md font-bold bg-[#4c6b54] text-[#f7eaf0] hover:bg-[#3b5341] transition-colors">
            Tìm kiếm
          </Button>
        </form>

        {/* History and Popular Words */}
        <div className="mt-3.5 flex flex-col gap-2 px-1 text-xs text-[#7e7363]">
          {recentSearches.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="flex items-center gap-1 font-semibold text-[#8c7e6c] uppercase tracking-wider text-[10px]">
                <History className="size-3" /> Đã tìm gần đây:
              </span>
              {recentSearches.map((s, idx) => (
                <div key={idx} className="inline-flex items-center bg-[#f2e9d7] hover:bg-[#ebdcb9] rounded-md px-2 py-0.5 transition-colors">
                  <button type="button" onClick={() => { setSearchValue(s); handleSearchSubmit(s); }} className="text-[#5a5045]">
                    {s}
                  </button>
                </div>
              ))}
              <button onClick={handleClearRecentSearches} className="text-red-700 hover:underline flex items-center gap-0.5 ml-2 font-semibold text-[10px] uppercase tracking-wider">
                <Trash2 className="size-2.5" /> Xóa lịch sử
              </button>
            </div>
          )}

          <div className="flex items-center flex-wrap gap-1.5 mt-1">
            <span className="font-semibold text-[#8c7e6c] uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Sparkles className="size-3" /> Từ khóa gợi ý:
            </span>
            {['Học sinh giỏi', 'Lý luận văn học', 'Nghị luận xã hội', 'Trần Đình Sử', 'Hà Tĩnh'].map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => { setSearchValue(kw); handleSearchSubmit(kw); }}
                className="bg-[#ebdcb9]/40 hover:bg-[#ebdcb9]/80 border border-[#e6d8c4] rounded-md px-2.5 py-0.5 text-[#635748] transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* 3. SIDEBAR FILTERS (Desktop) */}
        <aside className="hidden lg:block w-72 shrink-0 lg:sticky lg:top-20 bg-[#fbf7ee] rounded-md p-5 border-2 border-[#ebdcb9] shadow-sm">
          <FilterPanel />
        </aside>

        {/* 4. MAIN CONTENT AREA */}
        <main className="flex-1 w-full min-w-0">

          {/* Header Controls for Main Grid */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 font-sans border-b border-border/40 pb-4">
            <div>
              <p className="text-sm text-[#7e7363] font-sans">
                Tìm thấy <span className="font-bold text-foreground">{initialPagination.total}</span> tài liệu văn học
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Button (Sheet trigger) */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-9 px-3.5 border-[#ebdcb9] hover:bg-[#ebdcb9]/30 text-[#635748] text-xs rounded-md">
                      <SlidersHorizontal className="mr-1.5 size-4" /> Bộ lọc
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-[#fbf7ee] border-l-[#ebdcb9] w-80">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="font-sans font-bold text-[#4c6b54]">Tìm kiếm tài liệu</SheetTitle>
                      <SheetDescription>Điều chỉnh các thông số để khám phá thư viện tài liệu.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4">
                      <FilterPanel />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap hidden sm:inline">Sắp xếp:</span>
                <Select value={currentSort || '-createdAt'} onValueChange={(v) => updateFilter('sort', v)}>
                  <SelectTrigger className="w-[170px] bg-[#fcf9f2] border-2 border-[#ebdcb9] hover:border-primary/45 rounded-md h-9 text-xs">
                    <SelectValue placeholder="Mới nhất" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#fcf9f2] border-[#ebdcb9] text-xs">
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Active Badges indicators */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap gap-2 items-center font-sans">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lọc hiện tại:</span>
              {currentCategory && (
                <Badge variant="secondary" className="bg-[#ebdcb9] text-[#635748] border-none flex items-center gap-1 text-xs">
                  Chuyên mục: {categories.find(c => c._id === currentCategory)?.name || currentCategory}
                  <button onClick={() => updateFilter('category', undefined)} className="font-bold hover:text-red-700 ml-1">×</button>
                </Badge>
              )}

              {currentTag && (
                <Badge variant="secondary" className="bg-[#ebdcb9] text-[#635748] border-none flex items-center gap-1 text-xs">
                  Thẻ: {currentTag}
                  <button onClick={() => updateFilter('tag', undefined)} className="font-bold hover:text-red-700 ml-1">×</button>
                </Badge>
              )}
              {currentSearch && (
                <Badge variant="secondary" className="bg-[#ebdcb9] text-[#635748] border-none flex items-center gap-1 text-xs">
                  Từ khóa: &ldquo;{currentSearch}&rdquo;
                  <button onClick={() => updateFilter('search', undefined)} className="font-bold hover:text-red-700 ml-1">×</button>
                </Badge>
              )}
              <Button size="sm" variant="link" onClick={clearFilters} className="text-xs h-6 text-red-700 hover:text-red-800 p-0">
                Xóa tất cả bộ lọc
              </Button>
            </div>
          )}

          {/* 5. MARKETPLACE GRID */}
          {initialDocuments.length === 0 ? (
            /* EMPTY STATES */
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-[#ebdcb9] rounded-md bg-[#ebdcb9]/10 max-w-2xl mx-auto font-sans">
              <div className="bg-[#fcf9f2] border border-[#ebdcb9] p-5 rounded-md mb-4 shadow-sm text-stone-500">
                <BookOpen className="size-10 opacity-75" />
              </div>
              <h3 className="text-xl font-bold text-[#4c6b54] mb-2">Trang Sách Trống Trơn</h3>
              <p className="text-[#7e7363] italic max-w-md leading-relaxed mb-6">
                Rất tiếc, không tìm thấy tài liệu nào khớp với các bộ lọc hiện tại của bạn. Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm nút bên dưới để xem toàn bộ tác phẩm.
              </p>
              <Button onClick={clearFilters} className="font-semibold bg-[#4c6b54] text-[#f7eaf0] hover:bg-[#3b5341] h-10 px-5 rounded-md shadow-sm">
                Xem toàn bộ Tủ sách
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4">
                {initialDocuments.map((doc) => {
                  const theme = getBookCoverTheme(doc._id);
                  const isSaved = bookmarkedIds.includes(doc._id);
                  const averageRating = doc.rating?.average || 0;
                  const purchaseCount = doc.purchaseCount || 0;

                  // Define trust badges
                  const isBestseller = purchaseCount >= 20;
                  const isHighlyRated = averageRating >= 4.7;
                  const isEditorChoice = doc.featured;

                  const coverImg = doc.coverImage?.trim() || 
                    (Array.isArray(doc.previewImages) && doc.previewImages.length > 0 ? doc.previewImages[0] : null) ||
                    (doc.previewFile && typeof doc.previewFile === 'string' && doc.previewFile.trim() !== '' && !doc.previewFile.toLowerCase().endsWith('.pdf') && !doc.previewFile.toLowerCase().endsWith('.zip') && !doc.previewFile.toLowerCase().endsWith('.docx') ? doc.previewFile : null);

                  return (
                    <Link
                      href={`/documents/${doc.slug}`}
                      key={doc._id}
                      className="block group h-full"
                    >
                      <Card className="h-full flex flex-col border-2 border-[#e6dfd3] bg-[#fcf9f2]/70 hover:bg-[#fcf9f2] rounded-xl overflow-hidden hover:border-[#4c6b54]/60 transition-all duration-300 shadow-xs hover:-translate-y-0.5">

                        {/* 5A. BOOK COVER CONTAINER (FULL-BLEED) */}
                        <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#f2ebd9]/40 border-b border-[#e6dfd3]">

                          {/* Bookmark button */}
                          <button
                            type="button"
                            onClick={(e) => toggleSaveDocument(doc._id, e)}
                            className="absolute top-2.5 right-2.5 z-20 size-7 flex items-center justify-center rounded-full bg-[#fcf9f2]/90 backdrop-blur-sm border border-[#e6dfd3] hover:border-primary/50 text-[#8c7e6c] hover:text-[#4c6b54] transition-all hover:scale-105 shadow-xs"
                          >
                            {isBookmarkLoading === doc._id ? (
                              <Loader2 className="size-3.5 animate-spin text-primary" />
                            ) : (
                              <Bookmark className={`size-3.5 ${isSaved ? 'fill-[#4c6b54] text-[#4c6b54]' : ''}`} />
                            )}
                          </button>

                          {/* Book Container with Cover Image or Fallback */}
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={doc.title}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="relative h-full w-full overflow-hidden transition-transform duration-500 group-hover:scale-105">
                              {/* Inner Page Simulation wrapper */}
                              <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-3 justify-between relative`}>

                                {/* Left Crease/Spine Shadow Overlay */}
                                <div className="absolute top-0 left-0 w-3.5 h-full bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10"></div>
                                <div className="absolute top-0 left-0.5 w-[0.5px] h-full bg-white/10 z-10"></div>

                                {/* Header border/pattern of book cover */}
                                <div className={`border border-current/15 rounded-md p-1.5 flex-1 flex flex-col justify-between items-center text-center relative`}>

                                  {/* Tiny category or brand label */}
                                  <span className="text-[8px] uppercase tracking-[0.1em] font-semibold opacity-75 truncate max-w-full">
                                    {doc.category?.name || 'VĂN CHƯƠNG'}
                                  </span>

                                  {/* Center: Title and Divider */}
                                  <div className="my-auto py-1">
                                    <h3 className="font-bold text-[11px] sm:text-xs leading-tight line-clamp-2 text-center px-0.5">
                                      {doc.title}
                                    </h3>

                                    {/* Vintage Decorative Book Ornament */}
                                    <div className="w-8 h-[0.5px] bg-current opacity-30 mx-auto my-1.5 relative rounded-full">
                                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-1 rotate-45 bg-[#fcf9f2] dark:bg-stone-900 border border-current"></div>
                                    </div>

                                    <p className="text-[9px] italic opacity-85 line-clamp-1">
                                      {doc.author}
                                    </p>
                                  </div>

                                  {/* Book format details at bottom of cover */}
                                  <div className="w-full flex items-center justify-between text-[7px] opacity-75 font-sans pt-0.5 border-t border-current/10">
                                    <span>{doc.fileFormat.toUpperCase()}</span>
                                    {doc.pageCount && <span>{doc.pageCount} TRANG</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 5B. METADATA & CONTENT DETAILS */}
                        <CardContent className="p-3 flex-1 flex flex-col justify-between font-sans">
                          <div>
                            {/* Standardized Shadcn Trust Signals & Indicators */}
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {isEditorChoice && (
                                <Badge variant="default" className="text-[10px] font-semibold px-2 py-0 rounded-full">
                                  Đề cử
                                </Badge>
                              )}
                              {isBestseller && (
                                <Badge variant="destructive" className="text-[10px] font-semibold px-2 py-0 rounded-full">
                                  Tải nhiều
                                </Badge>
                              )}
                              {isHighlyRated && (
                                <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0 rounded-full">
                                  Khuyên đọc
                                </Badge>
                              )}
                              {doc.uploader && (
                                <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0 text-muted-foreground border-[#ebdcb9] rounded-full">
                                  Đã kiểm định
                                </Badge>
                              )}
                            </div>

                            {/* Book Title text display */}
                            <h4 className="font-bold text-sm text-[#483d31] leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
                              {doc.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground italic mb-2">Tác giả: {doc.author}</p>
                          </div>

                          {/* Stats and Meta details */}
                          <div className="mt-auto">
                            <div className="flex items-center justify-between text-[10px] text-[#8c7e6c] border-t border-[#e6dfd3]/60 pt-2">
                              <span className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-[#cbb685] text-[#cbb685]" />
                                <strong className="text-[#5a5045]">{averageRating > 0 ? averageRating.toFixed(1) : 'Chưa có'}</strong>
                                {doc.rating?.count > 0 && `(${doc.rating.count})`}
                              </span>

                              <span className="flex items-center gap-0.5">
                                <Eye className="h-3 w-3" />
                                {doc.viewCount || 0} xem
                              </span>

                              <span className="flex items-center gap-0.5">
                                <Download className="h-3 w-3" />
                                {purchaseCount} tải
                              </span>
                            </div>
                          </div>
                        </CardContent>

                        {/* 5C. PRICE & DOWNLOAD BUTTON */}
                        <CardFooter className="p-3 pt-0 border-t border-[#e6dfd3]/40 bg-[#fcf9f2]/40">
                          <div className="w-full pt-2 flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Ấn phí</span>
                            <div className="flex items-baseline">
                              {doc.originalPrice && doc.originalPrice > doc.price && (
                                <span className="text-[11px] text-muted-foreground line-through mr-1.5 font-medium">
                                  {formatPrice(doc.originalPrice)}
                                </span>
                              )}
                              <span className={`text-sm font-extrabold tracking-tight ${doc.isFree ? 'text-[#3c6b41]' : 'text-[#8e2929]'}`}>
                                {formatPrice(doc.price)}
                              </span>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {initialPagination.totalPages > 1 && (
                <div className="mt-10">
                  <PaginationControls
                    pagination={initialPagination}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
