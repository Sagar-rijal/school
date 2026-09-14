import { request } from "./api";
import type { LoginPayload } from "./types/user";

export type LoginResult = {
  user: { id?: string; name?: string; email?: string } | null;
};

/** Logs in via our route handler, which stores the session in httpOnly cookies. */
export function loginUser(payload: LoginPayload) {
  return request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: payload,
    // A 401 here means wrong credentials, not an expired session
    redirectOnUnauthorized: false,
  });
}

/** Clears the session cookies (the backend has no logout endpoint). */
export function logoutUser() {
  return request("/api/auth/logout", { method: "POST", redirectOnUnauthorized: false });
}
