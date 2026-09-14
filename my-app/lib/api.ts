const BASE_URL = "/api/v1/school-backend";

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

/** Turns FastAPI error bodies (`detail` string or validation array) into one message. */
function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "Something went wrong";
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
  return "Something went wrong";
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}${buildQuery(options.query)}`;

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data), response.status);
  }

  return data as T;
}

/**
 * The OpenAPI spec doesn't document response bodies. Existing endpoints wrap
 * results in `{ data }`, so use that when present and fall back to the raw body.
 */
export function unwrap<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data;
  }
  return res as T;
}

/** Backend documents may use `_id` or `id`. */
export function getId(doc: { _id?: string; id?: string }): string {
  return doc._id ?? doc.id ?? "";
}
