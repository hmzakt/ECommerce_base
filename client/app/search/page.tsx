import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterPanel } from "@/components/shop/FilterPanel";
import { ActiveFilters } from "@/components/shop/ActiveFilters";
import { MobileFilterDrawer } from "@/components/shop/MobileFilterDrawer";
import { SearchBar } from "@/components/shop/SearchBar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
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
    sortBy: typeof searchParams.sortBy === "string" ? (searchParams.sortBy as ProductListParams["sortBy"]) : undefined,
    minPrice: typeof searchParams.minPrice === "string" ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: typeof searchParams.maxPrice === "string" ? parseFloat(searchParams.maxPrice) : undefined,
    featured: searchParams.featured === "true" ? true : undefined,
  };

  const [{ products, meta }, categories] = await Promise.all([
    getProducts(params),
    getCategories().catch(() => []),
  ]);

  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;
  const totalResults = meta?.total ?? products.length;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Search", href: "/search" },
    ...(searchQuery ? [{ label: `"${searchQuery}"` }] : []),
  ];

  return (
    <div className="section-padding">
      <Container>
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* Search Header with interactive SearchBar */}
        <div className="mb-12 border-b border-border pb-10 text-center max-w-3xl mx-auto space-y-6">
          <div>
            <p className="text-eyebrow text-muted-foreground mb-2">Search Catalog</p>
            <h1 className="font-display text-display-md sm:text-display-lg font-light text-foreground">
              {searchQuery ? `"${searchQuery}"` : "All Products"}
            </h1>
          </div>

          <SearchBar />

          <p className="text-sm text-muted-foreground pt-2">
            {totalResults} {totalResults === 1 ? "result" : "results"} found
            {searchQuery ? ` for "${searchQuery}"` : ""}
          </p>
        </div>

        {/* Results Area */}
        {products.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title={searchQuery ? "No matching products found" : "No products available"}
              description={
                searchQuery
                  ? `We couldn't find any products matching "${searchQuery}". Try using broader terms, checking for typos, or explore our collections.`
                  : "Try clearing your filters or exploring different categories."
              }
              action={{
                label: "Browse All Products",
                href: "/shop",
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <FilterPanel
                categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
                basePath="/search"
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              <MobileFilterDrawer
                categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
                basePath="/search"
              />

              <ActiveFilters basePath="/search" />

              <ProductGrid products={products} columns={3} />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/search"
                searchParams={searchParams}
              />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
