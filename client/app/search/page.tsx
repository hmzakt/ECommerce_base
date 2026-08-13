import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterPanel } from "@/components/shop/FilterPanel";
import { ActiveFilters } from "@/components/shop/ActiveFilters";
import { MobileFilterDrawer } from "@/components/shop/MobileFilterDrawer";
import { Pagination } from "@/components/ui/Pagination";
import { getProducts } from "@/lib/api/products";
import type { ProductListParams } from "@/lib/types/catalog";

export const metadata = {
  title: "Search Results",
  description: "Search our collection of premium home decor and beauty products.",
};

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const searchQuery = typeof searchParams.search === "string" ? searchParams.search : "";
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const limit = 20;

  const params: ProductListParams = {
    page,
    limit,
    search: searchQuery || undefined,
    sortBy: typeof searchParams.sortBy === "string" ? searchParams.sortBy as ProductListParams["sortBy"] : undefined,
    minPrice: typeof searchParams.minPrice === "string" ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: typeof searchParams.maxPrice === "string" ? parseFloat(searchParams.maxPrice) : undefined,
    featured: searchParams.featured === "true" ? true : undefined,
  };

  const { products, meta } = await getProducts(params);

  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;
  const totalResults = meta?.total ?? products.length;

  return (
    <div className="section-padding">
      <Container>
        <div className="mb-12 border-b border-border pb-8 text-center max-w-3xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-4">Search Results</p>
          <h1 className="font-display text-display-lg font-light text-foreground mb-4">
            {searchQuery ? `"${searchQuery}"` : "All Products"}
          </h1>
          <p className="text-body-lg text-muted-foreground">
            {totalResults} {totalResults === 1 ? "result" : "results"} found
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterPanel categories={[]} basePath="/search" hideCategory />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <MobileFilterDrawer categories={[]} basePath="/search" hideCategory />
            
            <ActiveFilters basePath="/search" />

            <ProductGrid 
              products={products} 
              columns={3} 
              emptyMessage={
                searchQuery 
                  ? `No products found for "${searchQuery}". Try checking your spelling or using more general terms.`
                  : "No products match your current filters."
              } 
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/search"
              searchParams={searchParams}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
