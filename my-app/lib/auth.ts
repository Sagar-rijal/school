import { apiRequest } from "./api";
import type { LoginPayload } from "./types/user";

export function loginUser(payload: LoginPayload) {
  return apiRequest("/auth/login", { method: "POST", body: payload });
}

/**
 * The backend has no logout endpoint, so a Next route handler
 * clears the auth cookies (they may be httpOnly, so JS can't).
 */
export async function logoutUser() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}
