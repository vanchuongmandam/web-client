// src/app/articles/[slug]/article-image-gallery.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import type { Media } from '@/lib/types';
import { X } from 'lucide-react';

interface ArticleImageGalleryProps {
  images: Media[];
}

export function ArticleImageGallery({ images }: ArticleImageGalleryProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  // Dynamically create class names for the grid based on image count
  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-2 grid-rows-2";
    if (count >= 4) return "grid-cols-2 grid-rows-2";
    return "grid-cols-1";
  };
  
  const totalImages = images.length;

  return (
    <>
      <div className={cn("grid gap-1 rounded-lg overflow-hidden", getGridClass(totalImages))} style={{gridAutoFlow: "dense"}}>
        {images.slice(0, 4).map((image, index) => {
          const isLastVisible = index === 3 && totalImages > 4;
          
          let itemClass = "";
          if (totalImages === 3 && index === 0) itemClass = "row-span-2";
          if (totalImages === 3 && (index === 1 || index === 2)) itemClass = "col-start-2";
          
          return (
            <div
              key={image.url}
              className={cn("relative cursor-pointer group", itemClass)}
              onClick={() => openLightbox(index)}
              style={{aspectRatio: '1/1'}}
            >
              <Image
                src={image.url}
                alt={`Article image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 40vw, 512px"
              />
              {isLastVisible && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">+{totalImages - 4}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-screen-xl h-screen-90 p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Xem ảnh</DialogTitle>
           <DialogClose asChild>
              <Button
                variant="default"
                className="absolute top-2 right-2 z-50 rounded-full h-10 w-10 p-2 bg-primary text-primary-foreground opacity-80 hover:opacity-100 transition-opacity"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Đóng</span>
              </Button>
            </DialogClose>
          <Carousel
            opts={{ loop: true, startIndex: selectedImageIndex }}
            className="w-full max-w-4xl"
          >
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative w-full h-[90vh]">
                     <Image
                        src={image.url}
                        alt={`Lightbox image ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="100vw"
                      />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {totalImages > 1 && (
                <>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none h-10 w-10" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none h-10 w-10" />
                </>
            )}
          </Carousel>
        </DialogContent>
      </Dialog>
    </>
  );
}
