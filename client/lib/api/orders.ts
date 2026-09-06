import { API_BASE_URL, ApiClientError } from "@/lib/api/client";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

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
  orderNumber: string;
  userId: string;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  subtotal: string;
  shippingCost: string;
  tax: string;
  total: string;
  shippingAddress: ShippingAddress | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
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
    const errors = payload.errors;
    throw new ApiClientError(message, response.status, code, errors);
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

export interface OrderListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function getOrdersApi(
  accessToken: string,
  params?: { page?: number; limit?: number; status?: string }
): Promise<{ orders: Order[]; meta: OrderListMeta }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";

  return orderRequest<{ orders: Order[]; meta: OrderListMeta }>(`/orders${qs}`, {
    method: "GET",
    accessToken,
  });
}

export async function getOrderByIdApi(
  accessToken: string,
  orderId: string
): Promise<{ order: Order }> {
  return orderRequest<{ order: Order }>(`/orders/${orderId}`, {
    method: "GET",
    accessToken,
  });
}

export async function cancelOrderApi(
  accessToken: string,
  orderId: string
): Promise<{ order: Order }> {
  return orderRequest<{ order: Order }>(`/orders/${orderId}/cancel`, {
    method: "PATCH",
    accessToken,
  });
}

export async function getShippingDetailsApi(
  accessToken: string,
  orderId: string
): Promise<{ shipping: { id?: string; trackingNumber: string | null; shippingProvider: string | null; status: string; estimatedDelivery: string | null } }> {
  return orderRequest(`/orders/${orderId}/shipping`, {
    method: "GET",
    accessToken,
  });
}
