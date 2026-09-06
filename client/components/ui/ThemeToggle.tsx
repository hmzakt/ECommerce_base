"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by rendering a placeholder with same dimensions
  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center p-1.5 text-foreground/40",
          className
        )}
        aria-hidden="true"
      >
        <span className="h-4 w-4" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-full p-1.5 text-foreground transition-colors hover:text-foreground/70 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        {isDark ? (
          // Sun icon for dark mode (click to go light)
          <svg
            className="h-4 w-4 stroke-[1.5] transition-transform duration-300 group-hover:rotate-45"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
            />
          </svg>
        ) : (
          // Moon icon for light mode (click to go dark)
          <svg
            className="h-4 w-4 stroke-[1.5] transition-transform duration-300 group-hover:-rotate-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </span>
      {showLabel && (
        <span className="text-eyebrow">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
