import type { ApiErrorResponse, ApiResponse } from "@/lib/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(path.startsWith("http") ? path : `${API_BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, body, headers, ...rest } = options;

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    next: rest.next ?? { revalidate: 60 },
  });

  const payload = (await response.json()) as ApiResponse<T> | ApiErrorResponse;

  if (!response.ok || !payload.success) {
    const message =
      "message" in payload ? payload.message : "Request failed";
    const code =
      "error" in payload && payload.error?.code ? payload.error.code : undefined;

    throw new ApiClientError(message, response.status, code);
  }

  return (payload as ApiResponse<T>).data;
}

export { API_BASE_URL };
