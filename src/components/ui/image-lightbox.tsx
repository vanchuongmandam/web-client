"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { CustomVideoPlayer } from "@/components/ui/custom-video-player";
import { X } from "lucide-react";

export interface LightboxMediaItem {
  url: string;
  caption?: string;
  mediaType?: "image" | "video" | "pdf" | string;
}

interface ImageLightboxProps {
  items: (string | LightboxMediaItem)[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function ImageLightbox({
  items,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}: ImageLightboxProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(initialIndex);

  const normalizedItems: LightboxMediaItem[] = items.map((item) => {
    if (typeof item === "string") {
      const isVideo = item.match(/\.(mp4|webm|ogg)$/i) !== null;
      return { url: item, mediaType: isVideo ? "video" : "image" };
    }
    return {
      url: item.url,
      caption: item.caption,
      mediaType: item.mediaType || "image",
    };
  });

  const totalMedia = normalizedItems.length;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentSlide(-1);
      onClose();
    }
  };

  useEffect(() => {
    if (!api) return;

    const handleSelect = (emblaApi: CarouselApi) => {
      if (emblaApi) setCurrentSlide(emblaApi.selectedScrollSnap());
    };

    api.on("select", handleSelect);
    handleSelect(api);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-screen-xl w-full h-full md:h-[90vh] md:w-[90vw] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
        <DialogTitle className="sr-only">{title || "Xem phương tiện"}</DialogTitle>
        <DialogClose asChild>
          <Button
            variant="default"
            className="absolute top-2 right-2 z-50 rounded-full h-10 w-10 p-2 bg-black/50 text-white opacity-80 hover:opacity-100 transition-opacity"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>
        <Carousel
          setApi={setApi}
          opts={{ loop: true, startIndex: initialIndex }}
          className="w-full max-w-5xl"
        >
          <CarouselContent>
            {normalizedItems.map((item, index) => (
              <CarouselItem key={index} className="flex items-center justify-center">
                <div className="relative w-full h-full md:h-[80vh] flex flex-col items-center justify-center">
                  {item.mediaType === "video" ? (
                    <CustomVideoPlayer
                      src={item.url}
                      playsInline
                      isActive={isOpen && index === currentSlide}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={item.url}
                        alt={item.caption || `Lightbox image ${index + 1}`}
                        className="max-h-[80vh] max-w-full object-contain"
                      />
                    </div>
                  )}
                  {item.caption && (
                    <p className="absolute bottom-16 text-center text-white text-sm bg-black/50 p-2 rounded-md">
                      {item.caption}
                    </p>
                  )}
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
  );
}
