"use client";

import { useRef } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/types/catalog";

interface ProductCarouselProps {
  products: Product[];
  className?: string;
}

export function ProductCarousel({ products, className }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      <div className="mb-6 hidden justify-end gap-2 sm:flex">
        <CarouselButton
          direction="left"
          onClick={() => scroll("left")}
          label="Scroll left"
        />
        <CarouselButton
          direction="right"
          onClick={() => scroll("right")}
          label="Scroll right"
        />
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Product carousel"
      >
        {products.map((product) => (
          <div
            key={product.id}
            role="listitem"
            className="w-[65vw] shrink-0 snap-start sm:w-[40vw] md:w-[30vw] lg:w-[22vw]"
          >
            <ProductCard product={product} size="compact" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CarouselButton({
  direction,
  onClick,
  label,
}: {
  direction: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center border border-border transition-colors hover:bg-muted"
    >
      <span aria-hidden="true">{direction === "left" ? "←" : "→"}</span>
    </button>
  );
}
