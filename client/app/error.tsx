"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="section-padding bg-muted/20 min-h-[70vh] flex flex-col justify-center items-center">
      <Container size="sm" className="text-center">
        <h1 className="font-display text-7xl md:text-9xl font-light mb-6 text-red-500/20">500</h1>
        <h2 className="text-2xl md:text-3xl font-medium mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-8">
          We apologize for the inconvenience. An unexpected error has occurred on our end.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-8 py-3 bg-foreground text-background font-medium text-sm hover:bg-foreground/80 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </Container>
    </div>
  );
}
