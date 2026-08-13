import { getHomepageConfig } from "@/lib/api/homepage";
import { getCategories } from "@/lib/api/categories";
import { getProducts, getProductsBySlugs } from "@/lib/api/products";
import type { Category, Product } from "@/lib/types/catalog";
import type {
  FeaturedCategoriesSectionConfig,
  FeaturedCategoryItemConfig,
  HomepageConfig,
  HomeSectionConfig,
  ProductSectionSelectionConfig,
  ResolvedFeaturedCategoriesSection,
  ResolvedFeaturedCategoryItem,
  ResolvedHomepageData,
  ResolvedHomeSection,
  ResolvedProductSection,
} from "@/lib/types/homepage";

async function resolveProductSelection(
  selection: ProductSectionSelectionConfig,
  featured?: boolean,
): Promise<Product[]> {
  const { mode, productSlugs, sortBy, maxProducts } = selection;

  if (mode === "manual" && productSlugs && productSlugs.length > 0) {
    const products = await getProductsBySlugs(productSlugs);
    const slugOrder = new Map(productSlugs.map((slug, index) => [slug, index]));

    return products
      .sort(
        (a, b) =>
          (slugOrder.get(a.slug) ?? 999) - (slugOrder.get(b.slug) ?? 999),
      )
      .slice(0, maxProducts);
  }

  const { products } = await getProducts({
    featured,
    sortBy: sortBy ?? (featured ? undefined : "newest"),
    limit: maxProducts,
  });

  return products.slice(0, maxProducts);
}

function resolveFeaturedCategories(
  config: FeaturedCategoriesSectionConfig,
  categories: Category[],
): ResolvedFeaturedCategoriesSection {
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));

  const items: ResolvedFeaturedCategoryItem[] = config.items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item) => resolveFeaturedCategoryItem(item, categoryMap))
    .filter((item): item is ResolvedFeaturedCategoryItem => item !== null);

  return {
    type: "featured-categories",
    title: config.title,
    description: config.description,
    items,
  };
}

function resolveFeaturedCategoryItem(
  item: FeaturedCategoryItemConfig,
  categoryMap: Map<string, Category>,
): ResolvedFeaturedCategoryItem | null {
  const category = categoryMap.get(item.categorySlug);

  if (!category) {
    return null;
  }

  return {
    categorySlug: category.slug,
    title: item.title ?? category.name,
    description: item.description ?? category.description,
    imageUrl: item.imageUrl ?? category.image,
    href: `/categories/${category.slug}`,
    order: item.order,
  };
}

async function resolveSection(
  section: HomeSectionConfig,
  categories: Category[],
): Promise<ResolvedHomeSection | null> {
  switch (section.type) {
    case "announcement":
    case "hero":
    case "value-props":
    case "editorial":
    case "image-text":
    case "testimonials":
    case "newsletter": {
      const { visible: _visible, order: _order, ...rest } = section;
      return rest;
    }

    case "featured-categories":
      return resolveFeaturedCategories(section, categories);

    case "new-arrivals": {
      const products = await resolveProductSelection(section.selection);
      return buildProductSection("new-arrivals", section, products);
    }

    case "featured-products": {
      const products = await resolveProductSelection(section.selection, true);
      return buildProductSection("featured-products", section, products);
    }

    case "product-carousel": {
      const products = await resolveProductSelection(section.selection);
      return buildProductSection("product-carousel", section, products);
    }

    default:
      return null;
  }
}

function buildProductSection(
  type: ResolvedProductSection["type"],
  section: {
    title: string;
    description?: string;
  },
  products: Product[],
): ResolvedProductSection {
  return {
    type,
    title: section.title,
    description: section.description,
    products,
  };
}

export async function getHomepageData(
  configOverride?: HomepageConfig,
): Promise<ResolvedHomepageData> {
  const config = configOverride ?? (await getHomepageConfig());
  const categories = await getCategories();

  const visibleSections = config.sections
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);

  const resolvedSections = await Promise.all(
    visibleSections.map((section) => resolveSection(section, categories)),
  );

  return {
    seo: config.seo,
    sections: resolvedSections.filter(
      (section): section is ResolvedHomeSection => section !== null,
    ),
  };
}
