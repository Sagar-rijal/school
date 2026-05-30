import { NextRequest, NextResponse } from "next/server";

const LOGIN_ROUTE = "/auth/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access-token")?.value;

  const isLoginPage = pathname === LOGIN_ROUTE;
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/schools") ||
    pathname.startsWith("/users");

  if (!token && (isProtectedRoute || !isLoginPage)) {
    return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/login", "/dashboard/:path*", "/schools/:path*", "/users/:path*"],
};