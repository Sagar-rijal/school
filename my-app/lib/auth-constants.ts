// Shared by proxy.ts, route handlers and client code — keep this file dependency-free.

export const ACCESS_TOKEN_COOKIE = "access-token";
export const REFRESH_TOKEN_COOKIE = "refresh-token";

export const LOGIN_ROUTE = "/auth/login";
export const HOME_ROUTE = "/dashboard";

/** Only allow redirects back into the dashboard (prevents open redirects via ?next=). */
export function safeRedirectPath(next: string | null | undefined) {
  return next && next.startsWith(HOME_ROUTE) ? next : HOME_ROUTE;
}
