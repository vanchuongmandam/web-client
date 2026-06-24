// src/app/articles/[slug]/article-image-gallery.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import type { Media } from '@/lib/types';
import { X, PlayCircle, Lock } from 'lucide-react';
import { CustomVideoPlayer } from '@/components/ui/custom-video-player';
import { RequestAccessModal } from '@/components/articles/RequestAccessModal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { instantUnlock } from '@/lib/api';

interface ArticleMediaGalleryProps {
  media: Media[];
  articleId: string;
  articleTitle: string;
}

const MediaItem = ({
  media,
  onClick,
  isOverlay,
  remainingCount,
  articleId,
  articleTitle,
  onRequestSuccess
}: {
  media: Media,
  onClick: () => void,
  isOverlay?: boolean,
  remainingCount?: number,
  articleId: string,
  articleTitle: string,
  onRequestSuccess: () => void
}) => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [isUnlockConfirmOpen, setIsUnlockConfirmOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (media.mediaType === 'pdf') return null;

  // Restricted Logic
  if (media.isRestricted && !media.accessGranted) {
    const hasPrice = media.unlockPrice && media.unlockPrice > 0;
    return (
      <div className="relative w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4 text-center border rounded-md">
        <Lock className="h-10 w-10 text-amber-600 mb-2" />
        <p className="text-sm text-slate-600 mb-3 font-medium">Nội dung bị hạn chế</p>
        {media.requestStatus === "pending" ? (
          <Button variant="secondary" disabled size="sm">Đang chờ duyệt</Button>
        ) : media.requestStatus === "rejected" ? (
          <Button variant="destructive" disabled size="sm">Yêu cầu bị từ chối</Button>
        ) : (
          <div className="flex flex-col gap-2 w-full max-w-[200px]">
            {hasPrice && (
              <>
                <Button 
                  onClick={() => {
                    if (!token) {
                      toast({
                        title: "Yêu cầu đăng nhập",
                        description: "Bạn cần đăng nhập để mở khóa nội dung.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setIsUnlockConfirmOpen(true);
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs" 
                  size="sm"
                >
                  Mở khóa ({formatPrice(media.unlockPrice!)})
                </Button>
                
                <Dialog open={isUnlockConfirmOpen} onOpenChange={setIsUnlockConfirmOpen}>
                  <DialogContent className="sm:max-w-[420px]">
                    <DialogTitle>Xác nhận mở khóa nội dung</DialogTitle>
                    <div className="py-4 space-y-2">
                      <p className="text-sm text-slate-600">
                        Bạn có chắc chắn muốn mở khóa nội dung này không?
                      </p>
                      <div className="bg-slate-50 border p-3 rounded-md text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Giá mở khóa:</span>
                          <span className="font-bold text-amber-700">{formatPrice(media.unlockPrice!)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Số dư hiện tại:</span>
                          <span className="font-semibold text-slate-700">{formatPrice(user?.balance || 0)}</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUnlockConfirmOpen(false)} disabled={isUnlocking}>
                        Hủy
                      </Button>
                      <Button 
                        onClick={async () => {
                          setIsUnlocking(true);
                          try {
                            await instantUnlock(articleId, media.url, token!);
                            toast({
                              title: "Mở khóa thành công",
                              description: "Nội dung đã được mở khóa bằng số dư ví.",
                            });
                            setIsUnlockConfirmOpen(false);
                            onRequestSuccess();
                          } catch (err: any) {
                            toast({
                              title: "Lỗi mở khóa",
                              description: err.message || "Không thể mở khóa nội dung này.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsUnlocking(false);
                          }
                        }} 
                        disabled={isUnlocking}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {isUnlocking ? "Đang xử lý..." : "Mở khóa ngay"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <RequestAccessModal
              articleId={articleId}
              articleTitle={articleTitle}
              token={token}
              onSuccess={onRequestSuccess}
            />
          </div>
        )}
      </div>
    );
  }

  const isVideo = media.mediaType === 'video';
  return (
    <div
      className="relative cursor-pointer group w-full h-full overflow-hidden"
      onClick={onClick}
    >
      {isVideo ? (
        <>
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <video
              src={media.url}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              muted
              loop
              playsInline
            />
          </div>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity group-hover:opacity-80">
            <PlayCircle className="h-12 w-12 lg:h-16 lg:w-16 text-white opacity-80" />
          </div>
        </>
      ) : (
        <Image
          src={media.url}
          alt={media.caption || 'Article media'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
      {isOverlay && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-4xl font-bold">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};


export function ArticleImageGallery({ media, articleId, articleTitle }: ArticleMediaGalleryProps) {
  // Chỉ lấy media là image hoặc video
  const filteredMedia = media.filter(m => m.mediaType === 'image' || m.mediaType === 'video');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleRequestSuccess = () => {
    router.refresh();
  };

  const openLightbox = (index: number) => {
    // Only open lightbox if access granted/not restricted
    if (filteredMedia[index].isRestricted && !filteredMedia[index].accessGranted) return;

    setSelectedMediaIndex(index);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = (open: boolean) => {
    if (!open) {
      // When dialog closes, setting currentSlide to an invalid index
      // will cause all CustomVideoPlayer instances to become inactive.
      setCurrentSlide(-1);
    }
    setIsLightboxOpen(open);
  }

  useEffect(() => {
    if (!api) return;

    const handleSelect = (emblaApi: CarouselApi) => {
      if (emblaApi) setCurrentSlide(emblaApi.selectedScrollSnap());
    };

    api.on('select', handleSelect);
    // Set initial slide correctly
    handleSelect(api);

    return () => {
      api.off('select', handleSelect);
    };
  }, [api]);

  const totalMedia = filteredMedia.length;

  const renderGrid = () => {
    switch (totalMedia) {
      case 1:
        return (
          <div className="w-full" style={{ aspectRatio: '16/9' }}>
            <MediaItem media={filteredMedia[0]} onClick={() => openLightbox(0)} articleId={articleId} articleTitle={articleTitle} onRequestSuccess={handleRequestSuccess} />
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-1" style={{ aspectRatio: '2/1' }}>
            <MediaItem media={filteredMedia[0]} onClick={() => openLightbox(0)} articleId={articleId} articleTitle={articleTitle} onRequestSuccess={handleRequestSuccess} />
            <MediaItem media={filteredMedia[1]} onClick={() => openLightbox(1)} articleId={articleId} articleTitle={articleTitle} onRequestSuccess={handleRequestSuccess} />
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-3 grid-rows-2 gap-1 h-96 lg:h-[500px]">
            <div className="col-span-2 row-span-2">
              <MediaItem media={filteredMedia[0]} onClick={() => openLightbox(0)} articleId={articleId} articleTitle={articleTitle} onRequestSuccess={handleRequestSuccess} />
            </div>
            <div className="col-span-1 row-span-1">
              <MediaItem media={filteredMedia[1]} onClick={() => openLightbox(1)} articleId={articleId} articleTitle={articleTitle} onRequestSuccess={handleRequestSuccess} />
            </div>
            <div className="col-span-1 row-span-1">
              <MediaItem media={filteredMedia[2]} onClick={() => openLightbox(2)} articleId={articleId} articleTitle={articleTitle} onRequestSuccess={handleRequestSuccess} />
            </div>
          </div>
        );
      default: // 4 or more
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 h-96 lg:h-[600px]">
            {filteredMedia.slice(0, 4).map((item, index) => {
              const isLastVisible = index === 3 && totalMedia > 4;
              return (
                <MediaItem
                  key={item.url + index}
                  media={item}
                  onClick={() => openLightbox(index)}
                  isOverlay={isLastVisible}
                  remainingCount={totalMedia - 4}
                  articleId={articleId}
                  articleTitle={articleTitle}
                  onRequestSuccess={handleRequestSuccess}
                />
              );
            })}
          </div>
        );
    }
  };


  return (
    <>
      <div className="rounded-lg overflow-hidden my-6">
        {renderGrid()}
      </div>

      <Dialog open={isLightboxOpen} onOpenChange={handleCloseLightbox}>
        <DialogContent className="max-w-screen-xl w-full h-full md:h-screen-90 md:w-screen-90 p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">View Media</DialogTitle>
          <DialogClose asChild>
            <Button
              variant="default"
              className="absolute top-2 right-2 z-50 rounded-full h-10 w-10 p-2 bg-black/50 text-white opacity-80 hover:opacity-100 transition-opacity"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
          <Carousel
            setApi={setApi}
            opts={{ loop: true, startIndex: selectedMediaIndex }}
            className="w-full max-w-5xl"
          >
            <CarouselContent>
              {filteredMedia.map((item, index) => (
                <CarouselItem key={index} className="flex items-center justify-center">
                  <div className="relative w-full h-full md:h-[80vh] flex flex-col items-center justify-center">
                    {item.mediaType === 'image' ? (
                      <Image
                        src={item.url}
                        alt={item.caption || `Lightbox image ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="100vw"
                      />
                    ) : (
                      <CustomVideoPlayer
                        src={item.url}
                        playsInline
                        isActive={isLightboxOpen && index === currentSlide}
                        className="w-full h-full object-contain"
                      />
                    )}
                    {item.caption && <p className="absolute bottom-16 text-center text-white text-sm bg-black/50 p-2 rounded-md">{item.caption}</p>}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {totalMedia > 1 && (
              <>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none h-12 w-12" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none h-12 w-12" />
              </>
            )}
          </Carousel>
        </DialogContent>
      </Dialog>
    </>
  );
}
