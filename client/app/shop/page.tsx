import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterPanel } from "@/components/shop/FilterPanel";
import { ActiveFilters } from "@/components/shop/ActiveFilters";
import { MobileFilterDrawer } from "@/components/shop/MobileFilterDrawer";
import { Pagination } from "@/components/ui/Pagination";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import type { ProductListParams } from "@/lib/types/catalog";

export const metadata = {
  title: "Shop All Products",
  description: "Browse our complete collection of premium home decor and beauty products.",
};

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShopPage(props: ShopPageProps) {
  const searchParams = await props.searchParams;

  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const limit = 20;

  const params: ProductListParams = {
    page,
    limit,
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
    sortBy: typeof searchParams.sortBy === "string" ? searchParams.sortBy as ProductListParams["sortBy"] : undefined,
    minPrice: typeof searchParams.minPrice === "string" ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: typeof searchParams.maxPrice === "string" ? parseFloat(searchParams.maxPrice) : undefined,
    featured: searchParams.featured === "true" ? true : undefined,
  };

  const [productsData, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  const { products, meta } = productsData;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;

  return (
    <div className="section-padding">
      <Container>
        <div className="mb-12 border-b border-border pb-8">
          <h1 className="font-display text-display-lg font-light text-foreground mb-4">
            The Collection
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl">
            Discover our carefully curated selection of premium home goods and beauty products, 
            designed to elevate your everyday living spaces.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterPanel categories={categories} basePath="/shop" />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <MobileFilterDrawer categories={categories} basePath="/shop" />
            
            <ActiveFilters basePath="/shop" />

            <ProductGrid 
              products={products} 
              columns={3} 
              emptyMessage="No products match your current filters. Try adjusting your criteria." 
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/shop"
              searchParams={searchParams}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
