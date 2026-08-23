"use client";

import { useState } from "react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/utils";

interface FeaturedImageFallbackProps {
  initialImageUrl?: string;
  title: string;
  priority?: boolean;
}

export function FeaturedImageFallback({ initialImageUrl, title, priority = false }: FeaturedImageFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getMediaUrl(initialImageUrl);
  const showBanner = !imageUrl || imageError;

  return (
    <div className="relative h-64 md:h-auto w-full bg-muted overflow-hidden">
      {!showBanner ? (
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          priority={priority}
          onError={() => setImageError(true)}
        />
      ) : (
        <div 
          className="absolute inset-0 flex items-center justify-center p-8 text-center shadow-inner"
          style={{
            backgroundColor: '#fdfbf7',
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard-flat.png")',
            color: '#4a4a4a',
            borderBottom: '1px solid #e6e1d5'
          }}
        >
          <h3 className="font-sans text-2xl md:text-4xl font-medium leading-tight">
            {title}
          </h3>
        </div>
      )}
    </div>
  );
}


