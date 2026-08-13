import { EditorialSection } from "@/components/home/EditorialSection";
import { FeaturedCategoriesSection } from "@/components/home/FeaturedCategoriesSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { HeroSection } from "@/components/home/HeroSection";
import { ImageTextSection } from "@/components/home/ImageTextSection";
import { NewArrivalsSection } from "@/components/home/NewArrivalsSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { ProductCarouselSection } from "@/components/home/ProductCarouselSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { ValuePropsSection } from "@/components/home/ValuePropsSection";
import type { ResolvedHomeSection } from "@/lib/types/homepage";

interface HomePageSectionsProps {
  sections: ResolvedHomeSection[];
}

export function HomePageSections({ sections }: HomePageSectionsProps) {
  return (
    <>
      {sections.map((section) => (
        <SectionRenderer key={section.type + getSectionKey(section)} section={section} />
      ))}
    </>
  );
}

function getSectionKey(section: ResolvedHomeSection): string {
  if ("title" in section) {
    return section.title;
  }
  if ("text" in section) {
    return section.text;
  }
  return "";
}

function SectionRenderer({ section }: { section: ResolvedHomeSection }) {
  switch (section.type) {
    case "hero":
      return <HeroSection {...section} />;

    case "value-props":
      return <ValuePropsSection {...section} />;

    case "featured-categories":
      return <FeaturedCategoriesSection {...section} />;

    case "new-arrivals":
      return <NewArrivalsSection {...section} />;

    case "featured-products":
      return <FeaturedProductsSection {...section} />;

    case "editorial":
      return <EditorialSection {...section} />;

    case "image-text":
      return <ImageTextSection {...section} />;

    case "product-carousel":
      return <ProductCarouselSection {...section} />;

    case "testimonials":
      return <TestimonialsSection {...section} />;

    case "newsletter":
      return <NewsletterSection {...section} />;

    case "announcement":
      return null;

    default:
      return null;
  }
}
