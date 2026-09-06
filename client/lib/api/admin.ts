import { API_BASE_URL, ApiClientError } from "@/lib/api/client";

// ─── Generic Admin Request ─────────────────────────────────────────────────────
async function adminRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken: string;
  }
): Promise<T> {
  const { method = "GET", body, accessToken } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
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

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface DashboardSummary {
  users: { total: number };
  products: { total: number };
  orders: { total: number; pending: number };
  revenue: { allTime: string; today: string; thisMonth: string };
  topProducts: {
    productId: string;
    productName: string;
    productSku: string;
    totalQuantitySold: number;
    totalRevenue: string;
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: string;
    createdAt: string;
    customer: string;
  }[];
}

export interface RevenueTrend {
  trend: { date: string; revenue: string }[];
}

export interface OrderBreakdown {
  breakdown: { status: string; count: number }[];
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  price: string;
  compareAtPrice: string | null;
  costPrice: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; alt: string | null; displayOrder: number }[];
  shortDescription: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AdminUserMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export async function getDashboardSummaryApi(token: string): Promise<DashboardSummary> {
  return adminRequest<DashboardSummary>("/admin/dashboard", { accessToken: token });
}

export async function getRevenueTrendApi(token: string): Promise<RevenueTrend> {
  return adminRequest<RevenueTrend>("/admin/dashboard/revenue", { accessToken: token });
}

export async function getOrderBreakdownApi(token: string): Promise<OrderBreakdown> {
  return adminRequest<OrderBreakdown>("/admin/dashboard/orders", { accessToken: token });
}

// ─── Products ──────────────────────────────────────────────────────────────────
export async function getAdminProductsApi(
  token: string,
  params?: {
    page?: number; limit?: number; search?: string; sortBy?: string;
    category?: string; brand?: string; active?: boolean;
  }
): Promise<{ products: AdminProduct[]; meta: AdminProductMeta }> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.search) qs.set("search", params.search);
  if (params?.sortBy) qs.set("sortBy", params.sortBy);
  if (params?.category) qs.set("category", params.category);
  if (params?.brand) qs.set("brand", params.brand);
  if (params?.active !== undefined) qs.set("active", String(params.active));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return adminRequest(`/admin/products${query}`, { accessToken: token });
}

export async function createProductApi(
  token: string,
  data: {
    name: string; sku: string; brand: string; price: number | string;
    categoryId: string; shortDescription?: string; description?: string;
    compareAtPrice?: number | string | null; costPrice?: number | string | null;
    isActive?: boolean; isFeatured?: boolean;
    images?: { url: string; alt?: string }[];
  }
): Promise<{ product: AdminProduct }> {
  return adminRequest("/admin/products", { method: "POST", body: data, accessToken: token });
}

export async function updateProductApi(
  token: string,
  productId: string,
  data: Partial<{
    name: string; sku: string; brand: string; price: number | string;
    categoryId: string; shortDescription: string | null; description: string | null;
    compareAtPrice: number | string | null; costPrice: number | string | null;
    isActive: boolean; isFeatured: boolean;
    images: { url: string; alt?: string }[];
  }>
): Promise<{ product: AdminProduct }> {
  return adminRequest(`/admin/products/${productId}`, { method: "PATCH", body: data, accessToken: token });
}

export async function deleteProductApi(token: string, productId: string): Promise<void> {
  await adminRequest(`/admin/products/${productId}`, { method: "DELETE", accessToken: token });
}

// ─── Categories ────────────────────────────────────────────────────────────────
export async function getAdminCategoriesApi(
  token: string
): Promise<{ categories: AdminCategory[] }> {
  return adminRequest("/categories", { accessToken: token });
}

export async function createCategoryApi(
  token: string,
  data: { name: string; description?: string | null; image?: string | null; isActive?: boolean }
): Promise<{ category: AdminCategory }> {
  return adminRequest("/admin/categories", { method: "POST", body: data, accessToken: token });
}

export async function updateCategoryApi(
  token: string,
  categoryId: string,
  data: { name?: string; description?: string | null; image?: string | null; isActive?: boolean }
): Promise<{ category: AdminCategory }> {
  return adminRequest(`/admin/categories/${categoryId}`, { method: "PATCH", body: data, accessToken: token });
}

export async function deleteCategoryApi(token: string, categoryId: string): Promise<void> {
  await adminRequest(`/admin/categories/${categoryId}`, { method: "DELETE", accessToken: token });
}

// ─── Users ─────────────────────────────────────────────────────────────────────
export async function getAdminUsersApi(
  token: string,
  params?: { page?: number; limit?: number; search?: string }
): Promise<{ users: AdminUser[]; meta: AdminUserMeta }> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return adminRequest(`/admin/users${query}`, { accessToken: token });
}

export async function getAdminUserByIdApi(
  token: string, userId: string
): Promise<{ user: AdminUser }> {
  return adminRequest(`/admin/users/${userId}`, { accessToken: token });
}

export async function updateUserRoleApi(
  token: string, userId: string, role: string
): Promise<{ user: AdminUser }> {
  return adminRequest(`/admin/users/${userId}/role`, { method: "PATCH", body: { role }, accessToken: token });
}

export async function updateUserStatusApi(
  token: string, userId: string, isActive: boolean
): Promise<{ user: AdminUser }> {
  return adminRequest(`/admin/users/${userId}/status`, { method: "PATCH", body: { isActive }, accessToken: token });
}

// ─── Orders ────────────────────────────────────────────────────────────────────
export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: string;
  shippingCost: string;
  tax: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  shippingAddress: any;
  items: { id: string; productName: string; productSku: string; unitPrice: string; quantity: number; lineTotal: string }[];
}

export async function getAdminOrdersApi(
  token: string,
  params?: {
    page?: number; limit?: number; status?: string; paymentStatus?: string;
    dateFrom?: string; dateTo?: string; search?: string; sortBy?: string;
  }
): Promise<{ orders: AdminOrder[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  if (params?.paymentStatus) qs.set("paymentStatus", params.paymentStatus);
  if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params?.dateTo) qs.set("dateTo", params.dateTo);
  if (params?.search) qs.set("search", params.search);
  if (params?.sortBy) qs.set("sortBy", params.sortBy);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return adminRequest(`/admin/orders${query}`, { accessToken: token });
}

export async function getAdminOrderByIdApi(
  token: string, orderId: string
): Promise<{ order: AdminOrder }> {
  // Use customer order detail endpoint (returns same data, but we need admin one)
  // Admin uses GET /admin/orders but there's no /:id route — use customer order view
  return adminRequest(`/orders/${orderId}`, { accessToken: token });
}

export async function updateOrderStatusAdminApi(
  token: string, orderId: string,
  data: { status?: string; paymentStatus?: string }
): Promise<{ order: AdminOrder }> {
  return adminRequest(`/admin/orders/${orderId}/status`, { method: "PATCH", body: data, accessToken: token });
}

// ─── Shipping ──────────────────────────────────────────────────────────────────
export async function updateShippingAdminApi(
  token: string,
  shippingId: string,
  data: {
    trackingNumber?: string | null;
    shippingProvider?: string | null;
    estimatedDelivery?: string | null;
    actualDelivery?: string | null;
    status?: string;
  }
): Promise<{ shipping: any }> {
  return adminRequest(`/admin/shipping/${shippingId}`, { method: "PATCH", body: data, accessToken: token });
}
