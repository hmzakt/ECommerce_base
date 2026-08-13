import type { Category, Product } from "./catalog";

export type HomeSectionType =
  | "announcement"
  | "hero"
  | "value-props"
  | "featured-categories"
  | "new-arrivals"
  | "featured-products"
  | "editorial"
  | "image-text"
  | "product-carousel"
  | "testimonials"
  | "newsletter";

interface BaseSectionConfig {
  id: string;
  type: HomeSectionType;
  visible: boolean;
  order: number;
}

export interface AnnouncementSectionConfig extends BaseSectionConfig {
  type: "announcement";
  text: string;
  link?: string;
  linkLabel?: string;
}

export interface HeroSectionConfig extends BaseSectionConfig {
  type: "hero";
  eyebrow?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageUrl: string;
  imageAlt: string;
}

export interface ValuePropItemConfig {
  eyebrow: string;
  title: string;
  description?: string;
}

export interface ValuePropsSectionConfig extends BaseSectionConfig {
  type: "value-props";
  items: ValuePropItemConfig[];
}

export interface FeaturedCategoryItemConfig {
  categorySlug: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  order: number;
}

export interface FeaturedCategoriesSectionConfig extends BaseSectionConfig {
  type: "featured-categories";
  title: string;
  description?: string;
  items: FeaturedCategoryItemConfig[];
}

export interface ProductSectionSelectionConfig {
  mode: "auto" | "manual";
  productSlugs?: string[];
  sortBy?: "newest" | "oldest" | "price_asc" | "price_desc";
  maxProducts: number;
}

export interface NewArrivalsSectionConfig extends BaseSectionConfig {
  type: "new-arrivals";
  title: string;
  description?: string;
  selection: ProductSectionSelectionConfig;
}

export interface FeaturedProductsSectionConfig extends BaseSectionConfig {
  type: "featured-products";
  title: string;
  description?: string;
  selection: ProductSectionSelectionConfig;
}

export interface EditorialSectionConfig extends BaseSectionConfig {
  type: "editorial";
  eyebrow?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition?: "left" | "right";
}

export interface ImageTextSectionConfig extends BaseSectionConfig {
  type: "image-text";
  eyebrow?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl: string;
  imageAlt: string;
  layout?: "image-left" | "image-right";
}

export interface ProductCarouselSectionConfig extends BaseSectionConfig {
  type: "product-carousel";
  title: string;
  description?: string;
  selection: ProductSectionSelectionConfig;
}

export interface TestimonialItemConfig {
  quote: string;
  author: string;
  role?: string;
}

export interface TestimonialsSectionConfig extends BaseSectionConfig {
  type: "testimonials";
  eyebrow?: string;
  title: string;
  items: TestimonialItemConfig[];
}

export interface NewsletterSectionConfig extends BaseSectionConfig {
  type: "newsletter";
  title: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
}

export type HomeSectionConfig =
  | AnnouncementSectionConfig
  | HeroSectionConfig
  | ValuePropsSectionConfig
  | FeaturedCategoriesSectionConfig
  | NewArrivalsSectionConfig
  | FeaturedProductsSectionConfig
  | EditorialSectionConfig
  | ImageTextSectionConfig
  | ProductCarouselSectionConfig
  | TestimonialsSectionConfig
  | NewsletterSectionConfig;

export interface HomepageConfig {
  seo: {
    title: string;
    description: string;
    ogImage?: string;
  };
  sections: HomeSectionConfig[];
}

export interface ResolvedFeaturedCategoryItem {
  categorySlug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  href: string;
  order: number;
}

export interface ResolvedFeaturedCategoriesSection {
  type: "featured-categories";
  title: string;
  description?: string;
  items: ResolvedFeaturedCategoryItem[];
}

export interface ResolvedProductSection {
  type: "new-arrivals" | "featured-products" | "product-carousel";
  title: string;
  description?: string;
  products: Product[];
}

export type ResolvedHomeSection =
  | Omit<AnnouncementSectionConfig, "visible" | "order">
  | Omit<HeroSectionConfig, "visible" | "order">
  | Omit<ValuePropsSectionConfig, "visible" | "order">
  | ResolvedFeaturedCategoriesSection
  | ResolvedProductSection
  | Omit<EditorialSectionConfig, "visible" | "order">
  | Omit<ImageTextSectionConfig, "visible" | "order">
  | Omit<TestimonialsSectionConfig, "visible" | "order">
  | Omit<NewsletterSectionConfig, "visible" | "order">;

export interface ResolvedHomepageData {
  seo: HomepageConfig["seo"];
  sections: ResolvedHomeSection[];
}

export interface FeaturedCategoryOverride {
  category: Category;
  title: string;
  description: string | null;
  imageUrl: string | null;
  order: number;
}
