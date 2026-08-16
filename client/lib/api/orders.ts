import { API_BASE_URL, ApiClientError } from "@/lib/api/client";

export interface ShippingAddress {
  fullName: string;
  streetAddress: string;
  apartment?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
  // Note: order items can also be included here if the backend returns them
}

async function orderRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string | null;
  } = {},
): Promise<T> {
  const { method = "POST", body, accessToken } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    const message = payload.message ?? "Request failed";
    const code = payload.error?.code;
    throw new ApiClientError(message, response.status, code);
  }

  return payload.data;
}

export async function checkoutApi(
  accessToken: string,
  shippingAddress: ShippingAddress
): Promise<{ order: Order }> {
  return orderRequest<{ order: Order }>("/checkout", {
    accessToken,
    body: { shippingAddress },
  });
}
