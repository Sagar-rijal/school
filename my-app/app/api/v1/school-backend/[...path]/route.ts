import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_PREFIX,
  applySession,
  authHeaders,
  backendUrl,
  clearSession,
  hasSession,
  refreshSession,
  sanitizeSetCookie,
} from "@/lib/server/backend";

/**
 * Forwards /api/v1/school-backend/* to the backend with the session attached.
 * If the backend says 401, the session is refreshed once and the request retried.
 */
async function proxy(req: NextRequest) {
  let path = req.nextUrl.pathname.replace(BACKEND_PREFIX, "");
  // The backend defines GET /tenant/ with a trailing slash
  if (path === "/tenant") path = "/tenant/";

  let url: string;
  try {
    url = backendUrl(path) + req.nextUrl.search;
  } catch (err) {
    return NextResponse.json({ message: String((err as Error).message) }, { status: 500 });
  }

  const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;
  const contentType = req.headers.get("content-type");

  const send = (accessToken?: string) =>
    fetch(url, {
      method: req.method,
      headers: {
        ...authHeaders(req, accessToken),
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body,
    });

  try {
    let res = await send();
    let refreshed: Awaited<ReturnType<typeof refreshSession>> = null;

    if (res.status === 401 && hasSession(req)) {
      refreshed = await refreshSession(req);
      if (refreshed) res = await send(refreshed.accessToken);
    }

    const text = await res.text();

    if (process.env.NODE_ENV === "development") {
      const note = refreshed ? " (after token refresh)" : "";
      console.log(`[proxy] ${req.method} ${path}${req.nextUrl.search} → ${res.status}${note}`);
    }

    const response = new NextResponse(text || null, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });

    if (res.status === 401) {
      // Refresh failed or wasn't possible — end the session so the app sends the user to login
      clearSession(response);
    } else {
      if (refreshed) applySession(response, refreshed.setCookies, refreshed.body);
      for (const cookie of res.headers.getSetCookie()) {
        response.headers.append("Set-Cookie", sanitizeSetCookie(cookie));
      }
    }

    return response;
  } catch (err) {
    console.error("[proxy] error:", err);
    return NextResponse.json({ message: "Could not reach the backend server" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
