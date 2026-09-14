import { NextRequest, NextResponse } from "next/server";

const LOGIN_ROUTE = "/auth/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access-token")?.value;

  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url));
  }

  if (token && pathname === LOGIN_ROUTE) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/login", "/dashboard/:path*"],
};
