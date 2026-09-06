import { API_BASE_URL, ApiClientError } from "@/lib/api/client";

export interface PaymentOrderResponse {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderNumber: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

async function paymentRequest<T>(
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

export async function createPaymentOrderApi(
  accessToken: string,
  orderId: string
): Promise<PaymentOrderResponse> {
  return paymentRequest<PaymentOrderResponse>("/payments/create-order", {
    accessToken,
    body: { orderId },
  });
}

export async function verifyPaymentApi(
  accessToken: string,
  payload: VerifyPaymentPayload
): Promise<{ status: string }> {
  return paymentRequest<{ status: string }>("/payments/verify", {
    accessToken,
    body: payload,
  });
}
