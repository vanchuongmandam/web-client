"use client";
import { toErrorMessage } from "@/lib/errors";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { cn } from '@/lib/utils';
import type { Media } from '@/lib/types';
import { PlayCircle, Lock } from 'lucide-react';
import { RequestAccessModal } from '@/components/articles/RequestAccessModal';
import { useAuthStore } from '@/stores/auth.store';
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
  const { token, user } = useAuthStore();
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
                          } catch (err) {
                            toast({
                              title: "Lỗi mở khóa",
                              description: toErrorMessage(err, "Không thể mở khóa nội dung này."),
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
      <div className="rounded-xl overflow-hidden my-6 border border-sand-light shadow-xs">
        {renderGrid()}
      </div>

      <ImageLightbox
        items={filteredMedia}
        initialIndex={selectedMediaIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        title={articleTitle}
      />
    </>
  );
}
