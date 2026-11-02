import { API_BASE_URL, ApiClientError } from "@/lib/api/client";

// ─── Enums & Domain Types ───────────────────────────────────────────────────────

export type ShipmentStatus =
  | "DRAFT"
  | "PENDING_PICKUP"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED_ATTEMPT"
  | "RTO_INITIATED"
  | "RTO_IN_TRANSIT"
  | "RTO_DELIVERED"
  | "CANCELLED"
  | "LOST"
  | "DAMAGED";

export interface ShipmentEvent {
  id: string;
  shipmentId?: string;
  status: string;
  statusCode?: string;
  location?: string;
  description: string;
  occurredAt: string;
}

export interface ShippingAddressSnapshot {
  fullName: string;
  streetAddress: string;
  apartment?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface CustomerShippingDetails {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  shippingProvider: string;
  courierName: string;
  trackingNumber: string;
  awbCode: string;
  trackingUrl?: string | null;
  estimatedDelivery?: string | null;
  actualDelivery?: string | null;
  labelUrl?: string | null;
  events: ShipmentEvent[];
  destination?: ShippingAddressSnapshot | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourierRateOption {
  courierId: number | string;
  courierName: string;
  rate: number;
  estimatedDays: number;
  rating: number;
  isCod: boolean;
  minWeight?: number;
  score?: number;
  breakdown?: {
    freight?: number;
    cod?: number;
    fuel?: number;
    other?: number;
  };
}

export interface OriginAddress {
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactPhone: string;
  contactEmail: string;
}

export interface FallbackDimensions {
  defaultPackageWeight: number;
  defaultLength: number;
  defaultBreadth: number;
  defaultHeight: number;
}

export interface StrategyWeights {
  costWeight: number;
  speedWeight: number;
  ratingWeight: number;
}

export interface ShippingSettings {
  id?: string;
  originAddress: OriginAddress;
  fallbackDimensions: FallbackDimensions;
  selectionStrategy: "CHEAPEST" | "FASTEST" | "BALANCED";
  strategyWeights: StrategyWeights;
  allowedCouriers: string[];
  autoCreateShipment: boolean;
  updatedAt?: string;
}

export interface ShippingProviderConfig {
  id: string;
  providerName: string;
  providerType: string;
  isActive: boolean;
  isMock: boolean;
  hasCredentials: boolean;
  updatedAt: string;
}

export interface AdminShipment {
  id: string;
  shipmentNumber: string;
  orderId: string;
  order?: {
    id: string;
    orderNumber: string;
    total: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  providerName: string;
  courierName?: string;
  awbNumber?: string;
  trackingUrl?: string;
  status: ShipmentStatus;
  shippingRate: number;
  isCod: boolean;
  packageWeight: number;
  length: number;
  breadth: number;
  height: number;
  pickupLocation?: string;
  destinationSnapshot?: ShippingAddressSnapshot;
  labelUrl?: string;
  manifestUrl?: string;
  invoiceUrl?: string;
  pickupRequestId?: string;
  pickupScheduledDate?: string;
  selectionStrategy?: string;
  selectionReason?: string;
  createdAt: string;
  updatedAt: string;
  events?: ShipmentEvent[];
}

// ─── Internal Request Helper ───────────────────────────────────────────────────

async function shippingRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string | null;
  } = {}
): Promise<T> {
  const { method = "GET", body, accessToken } = options;

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
    const message = payload.message ?? "Shipping request failed";
    const code = payload.error?.code;
    throw new ApiClientError(message, response.status, code);
  }

  if (payload.meta !== undefined) {
    return { ...payload.data, meta: payload.meta } as T;
  }

  return payload.data as T;
}

// ─── Customer Endpoints ────────────────────────────────────────────────────────

/**
 * Fetch detailed shipment tracking details for an order (Customer / Account).
 */
export async function getShippingDetailsApi(
  accessToken: string,
  orderId: string
): Promise<CustomerShippingDetails> {
  return shippingRequest<CustomerShippingDetails>(`/orders/${orderId}/shipping`, {
    method: "GET",
    accessToken,
  });
}

// ─── Admin Logistics Endpoints ─────────────────────────────────────────────────

/**
 * Check live courier rates and transit times for an order or manual specs.
 */
export async function checkRatesAdminApi(
  accessToken: string,
  params: {
    orderId?: string;
    destinationPincode?: string;
    weight?: number;
    length?: number;
    breadth?: number;
    height?: number;
    declaredValue?: number;
    isCod?: boolean;
  }
): Promise<{
  metrics: { weight: number; length: number; breadth: number; height: number };
  availableCouriers: CourierRateOption[];
  recommendedCourier: CourierRateOption | null;
  strategyUsed: string;
}> {
  return shippingRequest("/admin/shipping/rates", {
    method: "POST",
    accessToken,
    body: params,
  });
}

/**
 * Manually assign courier or trigger immediate dispatch for an order.
 */
export async function assignCourierAdminApi(
  accessToken: string,
  orderId: string,
  data?: {
    courierId?: number | string;
    courierName?: string;
    rate?: number;
    estimatedDays?: number;
  }
): Promise<{ shipment: AdminShipment }> {
  return shippingRequest(`/admin/shipping/orders/${orderId}/assign-courier`, {
    method: "POST",
    accessToken,
    body: data ?? {},
  });
}

/**
 * Generate shipping label, invoice, and manifest URLs for a shipment.
 */
export async function generateLabelAdminApi(
  accessToken: string,
  shipmentId: string
): Promise<{
  labelUrl: string;
  manifestUrl?: string;
  invoiceUrl?: string;
}> {
  return shippingRequest(`/admin/shipping/shipments/${shipmentId}/label`, {
    method: "POST",
    accessToken,
  });
}

/**
 * Schedule warehouse pickup with the carrier.
 */
export async function schedulePickupAdminApi(
  accessToken: string,
  shipmentId: string,
  pickupDate?: string
): Promise<{
  pickupRequestId: string;
  pickupScheduledDate: string;
  status: string;
}> {
  return shippingRequest(`/admin/shipping/shipments/${shipmentId}/pickup`, {
    method: "POST",
    accessToken,
    body: pickupDate ? { pickupDate } : {},
  });
}

/**
 * Sync live tracking checkpoints from the carrier.
 */
export async function syncTrackingAdminApi(
  accessToken: string,
  shipmentId: string
): Promise<{
  shipment: AdminShipment;
  events: ShipmentEvent[];
}> {
  return shippingRequest(`/admin/shipping/shipments/${shipmentId}/sync-tracking`, {
    method: "POST",
    accessToken,
  });
}

/**
 * Cancel an active shipment with the provider.
 */
export async function cancelShipmentAdminApi(
  accessToken: string,
  shipmentId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return shippingRequest(`/admin/shipping/shipments/${shipmentId}/cancel`, {
    method: "POST",
    accessToken,
    body: reason ? { reason } : {},
  });
}

/**
 * Fetch warehouse & courier selection settings.
 */
export async function getShippingSettingsAdminApi(
  accessToken: string
): Promise<{ settings: ShippingSettings }> {
  return shippingRequest<{ settings: ShippingSettings }>("/admin/shipping/settings", {
    method: "GET",
    accessToken,
  });
}

/**
 * Update warehouse origin, fallback metrics, selection strategy & courier whitelist.
 */
export async function updateShippingSettingsAdminApi(
  accessToken: string,
  data: Partial<ShippingSettings>
): Promise<{ settings: ShippingSettings }> {
  return shippingRequest<{ settings: ShippingSettings }>("/admin/shipping/settings", {
    method: "PUT",
    accessToken,
    body: data,
  });
}

/**
 * List all configured shipping providers.
 */
export async function getShippingProvidersAdminApi(
  accessToken: string
): Promise<{ providers: ShippingProviderConfig[] }> {
  return shippingRequest<{ providers: ShippingProviderConfig[] }>("/admin/shipping/providers", {
    method: "GET",
    accessToken,
  });
}

/**
 * Update provider credentials, active status, or mock mode toggle.
 */
export async function updateShippingProviderAdminApi(
  accessToken: string,
  providerName: string,
  data: {
    isActive?: boolean;
    isMock?: boolean;
    credentials?: Record<string, any>;
  }
): Promise<{ provider: ShippingProviderConfig }> {
  return shippingRequest<{ provider: ShippingProviderConfig }>(
    `/admin/shipping/providers/${providerName}`,
    {
      method: "PUT",
      accessToken,
      body: data,
    }
  );
}

