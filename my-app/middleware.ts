// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access-token")?.value;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/schools") ||
    pathname.startsWith("/users");

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/schools/:path*", "/users/:path*"],
};