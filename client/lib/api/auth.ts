import { API_BASE_URL, ApiClientError } from "@/lib/api/client";
import type { User, LoginPayload, RegisterPayload } from "@/lib/types/auth";

interface AuthResponse {
  user: User;
  accessToken: string;
}

async function authRequest<T>(
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

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  return authRequest<AuthResponse>("/auth/login", { body: payload });
}

export async function registerApi(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  return authRequest<AuthResponse>("/auth/register", { body: payload });
}

export async function refreshTokenApi(
  accessToken: string,
): Promise<{ accessToken: string }> {
  return authRequest<{ accessToken: string }>("/auth/refresh", {
    accessToken,
  });
}

export async function getMeApi(
  accessToken: string,
): Promise<{ user: User }> {
  return authRequest<{ user: User }>("/auth/me", {
    method: "GET",
    accessToken,
  });
}

export async function logoutApi(accessToken: string): Promise<void> {
  await authRequest("/auth/logout", { accessToken });
}
