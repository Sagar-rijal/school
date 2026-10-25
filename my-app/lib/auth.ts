import { request } from "./api";
import type { LoginPayload } from "./types/user";

export type LoginResult = {
  user: { id?: string; name?: string; email?: string } | null;
  mustChangePassword: boolean;
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

/** Revokes the backend session and clears the local session cookies. */
export function logoutUser() {
  return request("/api/auth/logout", { method: "POST", redirectOnUnauthorized: false });
}

/** The backend invalidates all sessions after a password change. */
export function changePassword(current_password: string, new_password: string) {
  return request("/api/v1/school-backend/auth/change-password", {
    method: "POST",
    body: { current_password, new_password },
  });
}
