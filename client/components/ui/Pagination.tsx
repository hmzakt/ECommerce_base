import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.append(key, value);
        }
      }
    });
    params.set("page", page.toString());
    return `${basePath}?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-center gap-2"
    >
      <Link
        href={createPageUrl(currentPage - 1)}
        className={cn(
          "flex h-10 w-10 items-center justify-center border border-border text-foreground transition-colors hover:bg-muted",
          currentPage <= 1 && "pointer-events-none opacity-50",
        )}
        aria-disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <span aria-hidden="true">←</span>
      </Link>

      <ul className="flex items-center gap-2">
        {pages.map((page) => (
          <li key={page}>
            <Link
              href={createPageUrl(page)}
              className={cn(
                "flex h-10 w-10 items-center justify-center border transition-colors",
                page === currentPage
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:bg-muted",
              )}
              aria-current={page === currentPage ? "page" : undefined}
              aria-label={`Page ${page}`}
            >
              {page}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={createPageUrl(currentPage + 1)}
        className={cn(
          "flex h-10 w-10 items-center justify-center border border-border text-foreground transition-colors hover:bg-muted",
          currentPage >= totalPages && "pointer-events-none opacity-50",
        )}
        aria-disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <span aria-hidden="true">→</span>
      </Link>
    </nav>
  );
}
