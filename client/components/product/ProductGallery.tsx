"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface ProductGalleryProps {
  images: { url: string; alt?: string | null }[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-[3/4] w-full bg-muted flex items-center justify-center text-muted-foreground">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-6">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex overflow-x-auto md:flex-col gap-4 md:w-20 shrink-0 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-[3/4] w-20 shrink-0 snap-start overflow-hidden border transition-colors",
                activeIndex === index ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={activeIndex === index}
            >
              <Image
                src={image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden flex-1">
        <Image
          src={images[activeIndex].url}
          alt={images[activeIndex].alt || "Product image"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
    </div>
  );
}
