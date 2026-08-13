import { API_BASE_URL, ApiClientError } from "@/lib/api/client";
import type { Cart } from "@/lib/types/cart";

async function cartRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken: string;
  },
): Promise<T> {
  const { method = "GET", body, accessToken } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new ApiClientError(
      payload.message ?? "Request failed",
      response.status,
      payload.error?.code,
    );
  }

  return payload.data;
}

export async function getCartApi(accessToken: string): Promise<Cart> {
  const data = await cartRequest<{ cart: Cart }>("/cart", { accessToken });
  return data.cart;
}

export async function addCartItemApi(
  accessToken: string,
  productId: string,
  quantity: number,
): Promise<Cart> {
  const data = await cartRequest<{ cart: Cart }>("/cart/items", {
    method: "POST",
    accessToken,
    body: { productId, quantity },
  });
  return data.cart;
}

export async function updateCartItemApi(
  accessToken: string,
  itemId: string,
  quantity: number,
): Promise<Cart> {
  const data = await cartRequest<{ cart: Cart }>(`/cart/items/${itemId}`, {
    method: "PATCH",
    accessToken,
    body: { quantity },
  });
  return data.cart;
}

export async function removeCartItemApi(
  accessToken: string,
  itemId: string,
): Promise<Cart> {
  const data = await cartRequest<{ cart: Cart }>(`/cart/items/${itemId}`, {
    method: "DELETE",
    accessToken,
  });
  return data.cart;
}

export async function clearCartApi(accessToken: string): Promise<Cart> {
  const data = await cartRequest<{ cart: Cart }>("/cart", {
    method: "DELETE",
    accessToken,
  });
  return data.cart;
}
