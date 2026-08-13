import { cn } from "@/lib/utils/cn";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types/catalog";

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
  className?: string;
  emptyMessage?: string;
}

const columnClasses = {
  2: "grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

export function ProductGrid({
  products,
  columns = 4,
  className,
  emptyMessage = "No products available.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="text-body-lg text-muted-foreground py-12 text-center">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-x-5 gap-y-10 sm:gap-x-6 sm:gap-y-12",
        columnClasses[columns],
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 2}
        />
      ))}
    </div>
  );
}
