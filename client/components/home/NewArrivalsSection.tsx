import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ResolvedProductSection } from "@/lib/types/homepage";

type NewArrivalsSectionProps = ResolvedProductSection;

export function NewArrivalsSection({
  title,
  description,
  products,
}: NewArrivalsSectionProps) {
  return (
    <section aria-labelledby="new-arrivals-heading" className="section-padding bg-surface">
      <Container>
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="new-arrivals-heading"
            title={title}
            description={description}
            className="mb-0"
          />
          <Link
            href="/shop?sort=newest"
            className="text-eyebrow shrink-0 text-foreground underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        <ProductGrid
          products={products}
          columns={4}
          emptyMessage="New arrivals will appear here once products are added."
        />
      </Container>
    </section>
  );
}
