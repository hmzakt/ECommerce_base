import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-muted/70", className)}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Image container */}
      <Skeleton className="aspect-3/4 w-full" />
      {/* Title & category */}
      <div className="space-y-1.5 pt-1">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      {/* Price */}
      <Skeleton className="h-3.5 w-1/4" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 sm:gap-x-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton({
  cols = 5,
  rows = 5,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border/40">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="py-4 px-4">
              <Skeleton
                className={cn(
                  "h-4",
                  c === 0 ? "w-32" : c === cols - 1 ? "w-16" : "w-24"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
