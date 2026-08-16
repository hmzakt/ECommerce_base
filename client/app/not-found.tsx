import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <div className="section-padding bg-muted/20 min-h-[70vh] flex flex-col justify-center items-center">
      <Container size="sm" className="text-center">
        <h1 className="font-display text-7xl md:text-9xl font-light mb-6 text-foreground/20">404</h1>
        <h2 className="text-2xl md:text-3xl font-medium mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 bg-foreground text-background font-medium text-sm hover:bg-foreground/80 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-8 py-3 border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </Container>
    </div>
  );
}
