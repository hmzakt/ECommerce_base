import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCard } from "@/components/category/CategoryCard";
import type { ResolvedFeaturedCategoriesSection } from "@/lib/types/homepage";

type FeaturedCategoriesSectionProps = ResolvedFeaturedCategoriesSection;

export function FeaturedCategoriesSection({
  title,
  description,
  items,
}: FeaturedCategoriesSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="featured-categories-heading" className="section-padding">
      <Container>
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="featured-categories-heading"
            title={title}
            description={description}
            className="mb-0"
          />
          <Link
            href="/shop"
            className="text-eyebrow shrink-0 text-foreground underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {items.map((item, index) => (
            <CategoryCard
              key={item.categorySlug}
              title={item.title}
              description={item.description}
              imageUrl={item.imageUrl}
              href={item.href}
              priority={index === 0}
              className={index === 0 ? "lg:row-span-1" : undefined}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
