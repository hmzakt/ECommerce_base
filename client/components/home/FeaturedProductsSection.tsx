import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ResolvedProductSection } from "@/lib/types/homepage";

type FeaturedProductsSectionProps = ResolvedProductSection;

export function FeaturedProductsSection({
  title,
  description,
  products,
}: FeaturedProductsSectionProps) {
  return (
    <section
      aria-labelledby="featured-products-heading"
      className="section-padding"
    >
      <Container>
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="featured-products-heading"
            title={title}
            description={description}
            className="mb-0"
          />
          <Link
            href="/shop?featured=true"
            className="text-eyebrow shrink-0 text-foreground underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        <ProductGrid
          products={products}
          columns={4}
          emptyMessage="Featured products will appear here once configured."
        />
      </Container>
    </section>
  );
}
