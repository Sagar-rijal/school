import { LOGIN_ROUTE } from "./auth-constants";
import { useAuthStore } from "@/store/useAuthStore";

const BASE_URL = "/api/v1/school-backend";

/** Give up rather than leaving a page loading forever on a stalled connection. */
const REQUEST_TIMEOUT_MS = 30_000;

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  headers?: HeadersInit;
};

/** Standard response envelope returned by the backend. */
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function buildQuery(query?: Record<string, QueryValue>) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Turns backend error bodies into one message: `detail`, `message`, plain text, or the status. */
function extractErrorMessage(data: unknown, status: number): string {
  const fallback = `Request failed (${status}). Please try again.`;
  if (typeof data === "string" && data.trim()) return data.trim().slice(0, 200);
  if (!data || typeof data !== "object") return fallback;
  const { detail, message } = data as { detail?: unknown; message?: unknown };

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: (string | number)[]; msg?: string }) => {
        const field = d.loc?.filter((l) => l !== "body").join(".");
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .join(", ");
  }
  if (typeof message === "string") return message;
  return fallback;
}

/** Session is gone (refresh already failed server-side) — send the user to login. */
function redirectToLogin() {
  if (typeof window === "undefined" || window.location.pathname === LOGIN_ROUTE) return;
  useAuthStore.getState().clearAuthUser();
  const next = window.location.pathname + window.location.search;
  window.location.assign(`${LOGIN_ROUTE}?next=${encodeURIComponent(next)}`);
}

export function apiRequest<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(`${BASE_URL}${endpoint}`, options);
}

/** Low-level request to any same-site URL. Prefer `apiRequest` for backend endpoints. */
export async function request<T = unknown>(
  path: string,
  options: RequestOptions & { redirectOnUnauthorized?: boolean } = {}
): Promise<T> {
  const url = `${path}${buildQuery(options.query)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      credentials: "include",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError("The server took too long to respond. Please try again.", 408);
    }
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (response.status === 401 && options.redirectOnUnauthorized !== false) {
    redirectToLogin();
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, response.status), response.status);
  }

  return data as T;
}

/**
 * The OpenAPI spec doesn't document response bodies. Existing endpoints wrap
 * results in `{ data }`, so use that when present and fall back to the raw body.
 */
export function unwrap<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data;
  }
  return res as T;
}

/** Finds the new record's id in a create response (`{ data: { _id } }`, `{ id }`, `{ inserted_id }`...). */
export function findCreatedId(res: unknown): string | undefined {
  const keys = ["_id", "id", "user_id", "inserted_id"];
  const containers = [unwrap(res), res];
  for (const c of containers) {
    if (typeof c === "string" && c) return c;
    if (!c || typeof c !== "object") continue;
    for (const key of keys) {
      const value = (c as Record<string, unknown>)[key];
      if (typeof value === "string" && value) return value;
    }
  }
}

/** Backend documents may use `_id` or `id`. */
export function getId(doc: { _id?: string; id?: string }): string {
  return doc._id ?? doc.id ?? "";
}
