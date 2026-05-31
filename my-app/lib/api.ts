const BASE_URL = "https://9v1s3gvk-8081.inc1.devtunnels.ms/";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
};

export async function apiRequest(endpoint: string, options: RequestOptions = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "access-token": token } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
   if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }
  return data;
}