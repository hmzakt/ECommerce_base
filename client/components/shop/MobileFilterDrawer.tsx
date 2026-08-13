"use client";

import { useState } from "react";
import { FilterPanel } from "./FilterPanel";
import { Button } from "@/components/ui/Button";

interface MobileFilterDrawerProps {
  categories: { slug: string; name: string }[];
  basePath?: string;
  hideCategory?: boolean;
}

export function MobileFilterDrawer(props: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        className="lg:hidden mb-6 w-full flex items-center justify-between px-4"
        onClick={() => setIsOpen(true)}
      >
        <span>Filter & Sort</span>
        <span aria-hidden="true">+</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-2xl font-light">Filters</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-foreground hover:text-muted-foreground p-2"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <FilterPanel {...props} />
            </div>

            <div className="border-t border-border p-6">
              <Button
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                View Results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
