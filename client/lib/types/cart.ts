import type { Product } from "@/lib/types/catalog";

export interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  image: string | null;
  imageAlt: string | null;
}

export interface CartItem {
  id: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: CartItemProduct;
  lineTotal: string;
}

export interface Cart {
  id: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  subtotal: string;
  totalItems: number;
  estimatedTotal: string;
}

/** Shape used when adding to cart from product detail */
export interface AddToCartPayload {
  productId: string;
  quantity: number;
}
