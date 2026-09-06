"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbItems: BreadcrumbItem[] =
    items ||
    (() => {
      const segments = pathname.split("/").filter(Boolean);
      const generated: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

      let accumulatedPath = "";
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        accumulatedPath += `/${seg}`;
        // Format segment: "mens-clothing" -> "Mens Clothing"
        const label = seg
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        generated.push({
          label,
          href: i === segments.length - 1 ? undefined : accumulatedPath,
        });
      }

      return generated;
    })();

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumbs"
      className={cn("flex items-center text-xs tracking-wider", className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span
                  className="opacity-40 select-none text-[10px]"
                  aria-hidden="true"
                >
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
