export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  displayOrder: number;
}

export interface ProductCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  sku: string;
  brand: string;
  price: string;
  compareAtPrice: string | null;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  category: ProductCategoryRef;
  images: ProductImage[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  featured?: boolean;
  sortBy?:
    | "newest"
    | "oldest"
    | "price_asc"
    | "price_desc"
    | "name_asc"
    | "name_desc";
  minPrice?: number;
  maxPrice?: number;
}
