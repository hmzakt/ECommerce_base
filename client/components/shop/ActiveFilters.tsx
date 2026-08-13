"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ActiveFiltersProps {
  basePath?: string;
}

export function ActiveFilters({ basePath = "/shop" }: ActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.delete("page"); // Reset page on filter change
      return params.toString();
    },
    [searchParams],
  );

  const removeFilter = (name: string) => {
    const query = createQueryString(name, "");
    router.push(`${basePath}?${query}`);
  };

  const activeFilters = [];

  const search = searchParams.get("search");
  if (search) activeFilters.push({ name: "search", label: `Search: ${search}` });

  const category = searchParams.get("category");
  if (category) activeFilters.push({ name: "category", label: `Category: ${category}` });

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    activeFilters.push({
      name: "price",
      label: `Price: ${minPrice ? `$${minPrice}` : "$0"} - ${maxPrice ? `$${maxPrice}` : "Any"}`,
      onRemove: () => {
        let params = new URLSearchParams(searchParams.toString());
        params.delete("minPrice");
        params.delete("maxPrice");
        params.delete("page");
        router.push(`${basePath}?${params.toString()}`);
      },
    });
  }

  const featured = searchParams.get("featured");
  if (featured === "true") activeFilters.push({ name: "featured", label: "Featured Only" });

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-8">
      <span className="text-sm text-muted-foreground mr-2">Active Filters:</span>
      {activeFilters.map((filter) => (
        <span
          key={filter.name}
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-foreground"
        >
          {filter.label}
          <button
            onClick={filter.onRemove || (() => removeFilter(filter.name))}
            className="hover:text-red-500"
            aria-label={`Remove ${filter.label} filter`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        onClick={() => router.push(basePath)}
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-2"
      >
        Clear All
      </button>
    </div>
  );
}
