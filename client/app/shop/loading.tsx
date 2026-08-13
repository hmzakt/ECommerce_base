import { Container } from "@/components/ui/Container";

export default function ShopLoading() {
  return (
    <div className="section-padding animate-pulse">
      <Container>
        <div className="mb-12 border-b border-border pb-8">
          <div className="h-12 w-64 bg-muted mb-4" />
          <div className="h-6 w-full max-w-2xl bg-muted" />
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Sidebar Skeleton */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-8">
            <div className="h-8 w-24 bg-muted mb-4" />
            <div className="h-10 w-full bg-muted" />
            <div className="h-8 w-24 bg-muted mb-4 mt-8" />
            <div className="h-32 w-full bg-muted" />
          </aside>

          {/* Main Content Skeleton */}
          <div className="flex-1">
            <div className="h-10 w-full lg:hidden bg-muted mb-6" />
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 sm:gap-x-6 sm:gap-y-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] w-full bg-muted" />
                  <div className="h-4 w-2/3 bg-muted" />
                  <div className="h-4 w-1/3 bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
