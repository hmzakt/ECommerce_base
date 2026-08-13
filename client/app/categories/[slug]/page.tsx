import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterPanel } from "@/components/shop/FilterPanel";
import { ActiveFilters } from "@/components/shop/ActiveFilters";
import { MobileFilterDrawer } from "@/components/shop/MobileFilterDrawer";
import { Pagination } from "@/components/ui/Pagination";
import { getProducts } from "@/lib/api/products";
import { getCategories, getCategoryBySlug } from "@/lib/api/categories";
import type { ProductListParams } from "@/lib/types/catalog";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(props: CategoryPageProps) {
  const params = await props.params;
  try {
    const category = await getCategoryBySlug(params.slug);
    return {
      title: category.name,
      description: category.description || `Browse our ${category.name} collection.`,
    };
  } catch {
    return {
      title: "Category Not Found",
    };
  }
}

export default async function CategoryPage(props: CategoryPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  let category;
  try {
    category = await getCategoryBySlug(params.slug);
  } catch {
    notFound();
  }

  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const limit = 20;

  const productParams: ProductListParams = {
    page,
    limit,
    category: params.slug, // Force category
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    sortBy: typeof searchParams.sortBy === "string" ? searchParams.sortBy as ProductListParams["sortBy"] : undefined,
    minPrice: typeof searchParams.minPrice === "string" ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: typeof searchParams.maxPrice === "string" ? parseFloat(searchParams.maxPrice) : undefined,
    featured: searchParams.featured === "true" ? true : undefined,
  };

  const [productsData, categories] = await Promise.all([
    getProducts(productParams),
    getCategories(),
  ]);

  const { products, meta } = productsData;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;
  const basePath = `/categories/${params.slug}`;

  return (
    <div>
      {/* Category Banner */}
      <div className="relative h-[40vh] min-h-[300px] w-full bg-muted">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-black/20" />
        <Container className="relative h-full flex items-end pb-12">
          <div className="max-w-2xl text-white">
            <h1 className="font-display text-display-lg font-light mb-4 text-white">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-body-lg text-white/90">
                {category.description}
              </p>
            )}
          </div>
        </Container>
      </div>

      <div className="section-padding">
        <Container>
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <FilterPanel 
                categories={categories} 
                basePath={basePath} 
                hideCategory 
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              <MobileFilterDrawer 
                categories={categories} 
                basePath={basePath} 
                hideCategory 
              />
              
              <ActiveFilters basePath={basePath} />

              <ProductGrid 
                products={products} 
                columns={3} 
                emptyMessage={`No products found in ${category.name} matching your criteria.`} 
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={basePath}
                searchParams={searchParams}
              />
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
