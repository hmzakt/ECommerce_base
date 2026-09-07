"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface SearchBarProps {
  basePath?: string;
  className?: string;
  suggestions?: string[];
  placeholder?: string;
}

const DEFAULT_SUGGESTIONS = [
  "Table Lamp",
  "Candles",
  "Ceramics",
  "Linen",
  "Brass",
  "Maison Atelier",
];

export function SearchBar({
  basePath = "/search",
  className,
  suggestions = DEFAULT_SUGGESTIONS,
  placeholder = "Search by product, brand, keyword, or SKU...",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("search") || "";
  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  const executeSearch = (term: string) => {
    const trimmed = term.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set("search", trimmed);
      // Default to relevance when searching
      if (!params.get("sortBy")) {
        params.set("sortBy", "relevance");
      }
    } else {
      params.delete("search");
      if (params.get("sortBy") === "relevance") {
        params.delete("sortBy");
      }
    }
    params.delete("page"); // reset pagination
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    executeSearch("");
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    executeSearch(term);
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-4", className)}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* Search Icon */}
        <div className="pointer-events-none absolute left-4 flex items-center text-muted-foreground">
          <svg
            className="h-5 w-5 stroke-[1.5]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search products"
          className="w-full rounded-full border border-border bg-background py-3.5 pl-12 pr-28 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground/70 hover:border-foreground/40 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />

        {/* Action buttons inside input */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 tracking-wider uppercase"
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggested Quick Search Chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground mr-1 select-none">Suggested:</span>
          {suggestions.map((suggestion) => {
            const isActive = currentQuery.toLowerCase() === suggestion.toLowerCase();
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors duration-150 border",
                  isActive
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
