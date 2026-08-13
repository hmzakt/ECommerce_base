import { Container } from "@/components/ui/Container";

export default function ProductLoading() {
  return (
    <div className="pb-24 pt-12 animate-pulse">
      <Container>
        {/* Breadcrumb Skeleton */}
        <div className="mb-8 h-4 w-48 bg-muted" />

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-24">
          {/* Gallery Skeleton */}
          <div className="w-full lg:w-1/2 flex flex-col-reverse gap-4 md:flex-row md:gap-6">
            <div className="flex gap-4 md:flex-col md:w-20 shrink-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] w-20 shrink-0 bg-muted border border-border" />
              ))}
            </div>
            <div className="aspect-[3/4] w-full bg-muted flex-1" />
          </div>

          {/* Product Info Skeleton */}
          <div className="w-full lg:w-1/2 flex flex-col pt-4 lg:pt-8">
            <div className="mb-8 border-b border-border pb-8 space-y-4">
              <div className="h-10 w-3/4 bg-muted" />
              <div className="h-8 w-1/4 bg-muted" />
            </div>

            <div className="space-y-3 mb-8">
              <div className="h-4 w-full bg-muted" />
              <div className="h-4 w-full bg-muted" />
              <div className="h-4 w-5/6 bg-muted" />
            </div>

            <div className="mb-10 h-4 w-32 bg-muted" />

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-12 w-32 bg-muted" />
              </div>
              <div className="h-12 w-full bg-muted" />
            </div>

            <div className="mt-12 space-y-6 border-t border-border pt-8">
              <div className="h-6 w-full bg-muted" />
              <div className="h-6 w-full bg-muted" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
