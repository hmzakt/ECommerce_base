"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

interface FilterPanelProps {
  categories: { slug: string; name: string }[];
  basePath?: string;
  hideCategory?: boolean;
}

export function FilterPanel({
  categories,
  basePath = "/shop",
  hideCategory = false,
}: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

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

  const handleFilterChange = (name: string, value: string) => {
    const query = createQueryString(name, value);
    router.push(`${basePath}?${query}`);
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let query = createQueryString("minPrice", minPrice);
    const params = new URLSearchParams(query);
    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    } else {
      params.delete("maxPrice");
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  const currentSort = searchParams.get("sortBy") || "";
  const currentCategory = searchParams.get("category") || "";
  const isFeatured = searchParams.get("featured") === "true";

  return (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <h3 className="text-eyebrow text-foreground mb-4">Search</h3>
        <input
          type="search"
          placeholder="Search products..."
          defaultValue={searchParams.get("search") || ""}
          className="w-full border border-border bg-transparent px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleFilterChange("search", e.currentTarget.value);
            }
          }}
        />
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-eyebrow text-foreground mb-4">Sort By</h3>
        <select
          value={currentSort || (searchParams.get("search") ? "relevance" : "")}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          className="w-full border border-border bg-background px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
        >
          {searchParams.get("search") ? (
            <option value="relevance">Relevance</option>
          ) : (
            <option value="">Featured</option>
          )}
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Category */}
      {!hideCategory && categories.length > 0 && (
        <div>
          <h3 className="text-eyebrow text-foreground mb-4">Category</h3>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => handleFilterChange("category", "")}
                className={`text-sm hover:underline ${
                  !currentCategory ? "font-semibold" : "text-muted-foreground"
                }`}
              >
                All Categories
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <button
                  onClick={() => handleFilterChange("category", category.slug)}
                  className={`text-sm hover:underline ${
                    currentCategory === category.slug
                      ? "font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="text-eyebrow text-foreground mb-4">Price Range</h3>
        <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full border border-border bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full border border-border bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm" variant="secondary" className="px-3">
            Go
          </Button>
        </form>
      </div>

      {/* Featured Toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) =>
              handleFilterChange("featured", e.target.checked ? "true" : "")
            }
            className="accent-foreground"
          />
          <span className="text-sm">Featured Products Only</span>
        </label>
      </div>
    </div>
  );
}
