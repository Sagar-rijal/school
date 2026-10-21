import { NextRequest, NextResponse } from "next/server";
import { canOpenPath, decodeSession } from "@/lib/access";
import { applySession, clearSession, findToken, readSetCookie, refreshSession } from "@/lib/server/backend";
import {
  ACCESS_TOKEN_COOKIE,
  HOME_ROUTE,
  LOGIN_ROUTE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth-constants";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  // A refresh token alone can renew the session before dashboard rendering.
  const hasSession = !!(accessToken || refreshToken);

  if (!hasSession && pathname.startsWith(HOME_ROUTE)) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === LOGIN_ROUTE) {
    return NextResponse.redirect(new URL(HOME_ROUTE, request.url));
  }

  // Refresh before rendering: refresh JWTs have no role or scope claims, so they
  // cannot drive the dashboard or its route guards after the access JWT expires.
  let session = decodeSession(accessToken);
  if (!session && refreshToken && pathname.startsWith(HOME_ROUTE)) {
    const refreshed = await refreshSession(request);
    if (!refreshed) {
      const loginUrl = new URL(LOGIN_ROUTE, request.url);
      loginUrl.searchParams.set("next", pathname + search);
      const response = NextResponse.redirect(loginUrl);
      clearSession(response);
      return response;
    }

    session = decodeSession(refreshed.accessToken);
    if (!session) {
      const response = NextResponse.redirect(new URL(LOGIN_ROUTE, request.url));
      clearSession(response);
      return response;
    }

    request.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken);
    const newRefreshToken = readSetCookie(refreshed.setCookies, REFRESH_TOKEN_COOKIE) ?? findToken(refreshed.body, "refresh");
    if (newRefreshToken) request.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken);

    const response = !canOpenPath(session, pathname)
      ? NextResponse.redirect(new URL(`${HOME_ROUTE}/forbidden`, request.url))
      : NextResponse.next({ request: { headers: request.headers } });
    applySession(response, refreshed.setCookies, refreshed.body);
    return response;
  }

  if (!session && pathname.startsWith(HOME_ROUTE)) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    loginUrl.searchParams.set("next", pathname + search);
    const response = NextResponse.redirect(loginUrl);
    clearSession(response);
    return response;
  }

  // Keep users out of areas their role can't use (the backend enforces this too)
  if (session && pathname.startsWith(HOME_ROUTE) && !canOpenPath(session, pathname)) {
    return NextResponse.redirect(new URL(`${HOME_ROUTE}/forbidden`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/login", "/dashboard/:path*"],
};
