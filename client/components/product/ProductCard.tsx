import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatPrice, calculateDiscount } from "@/lib/utils/format";
import type { Product } from "@/lib/types/catalog";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
  size?: "default" | "compact";
}

function getPrimaryImage(product: Product) {
  return product.images[0] ?? null;
}

export function ProductCard({
  product,
  priority = false,
  className,
  size = "default",
}: ProductCardProps) {
  const image = getPrimaryImage(product);
  const price = parseFloat(product.price);
  const compareAtPrice = product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;
  const discount = calculateDiscount(price, compareAtPrice);

  return (
    <article className={cn("group", className)}>
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            size === "default" ? "aspect-[3/4]" : "aspect-square",
          )}
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              sizes={
                size === "default"
                  ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  : "(max-width: 640px) 40vw, 20vw"
              }
              className="image-hover object-cover"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}

          {discount && (
            <span className="absolute left-3 top-3 bg-background px-2 py-1 text-eyebrow">
              −{discount}%
            </span>
          )}
        </div>

        <div className={cn("mt-4", size === "compact" && "mt-3")}>
          {product.category && (
            <p className="text-eyebrow text-muted-foreground mb-1.5">
              {product.category.name}
            </p>
          )}
          <h3
            className={cn(
              "font-display text-foreground transition-opacity group-hover:opacity-70",
              size === "default" ? "text-xl" : "text-lg",
            )}
          >
            {product.name}
          </h3>
          {product.shortDescription && size === "default" && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
              {product.shortDescription}
            </p>
          )}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-medium">{formatPrice(price)}</span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
