import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import type { ResolvedProductSection } from "@/lib/types/homepage";

type ProductCarouselSectionProps = ResolvedProductSection;

export function ProductCarouselSection({
  title,
  description,
  products,
}: ProductCarouselSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="product-carousel-heading" className="section-padding">
      <Container>
        <SectionHeading
          id="product-carousel-heading"
          title={title}
          description={description}
          className="mb-10"
        />
        <ProductCarousel products={products} />
      </Container>
    </section>
  );
}
