const BASE_URL = "/api/v1/school-backend";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
};

export async function apiRequest(endpoint: string, options: RequestOptions = {}) {
 

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
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