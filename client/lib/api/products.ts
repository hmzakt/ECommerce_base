import { apiRequest } from "@/lib/api/client";
import {
  filterMockProducts,
  getMockProductBySlug,
} from "@/lib/mock/catalog";
import type { Product, ProductListParams } from "@/lib/types/catalog";
import type { ApiMeta } from "@/lib/types/api";

interface ProductListResult {
  products: Product[];
  meta?: ApiMeta;
}

export async function getProducts(
  params: ProductListParams = {},
): Promise<ProductListResult> {
  try {
    const data = await apiRequest<{ products: Product[]; meta?: ApiMeta }>("/products", {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search,
        category: params.category,
        brand: params.brand,
        featured: params.featured,
        sortBy: params.sortBy,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
      },
    });

    return {
      products: data.products ?? [],
      meta: data.meta,
    };
  } catch {
    return {
      products: filterMockProducts({
        featured: params.featured,
        sortBy: params.sortBy,
        limit: params.limit,
        category: params.category,
      }),
    };
  }
}

export async function getProductBySlug(slug: string): Promise<Product> {
  try {
    const data = await apiRequest<{ product: Product }>(`/products/${slug}`);
    return data.product;
  } catch {
    const product = getMockProductBySlug(slug);
    if (!product) {
      throw new Error(`Product not found: ${slug}`);
    }
    return product;
  }
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (slugs.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    slugs.map((slug) => getProductBySlug(slug)),
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<Product> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);
}
