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
  const path = req.nextUrl.pathname.replace(BACKEND_PREFIX, "");

  let url: string;
  try {
    url = backendUrl(path) + req.nextUrl.search;
  } catch (err) {
    return NextResponse.json({ message: String((err as Error).message) }, { status: 500 });
  }

  // Preserve raw bytes for file uploads and pass required request metadata through.
  const body = req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined;
  const forwardedHeaders = Object.fromEntries(
    ["content-type", "accept", "idempotency-key", "range"]
      .map((name) => [name, req.headers.get(name)] as const)
      .filter((entry): entry is readonly [string, string] => !!entry[1])
  );

  const send = (accessToken?: string) =>
    fetch(url, {
      method: req.method,
      headers: {
        ...authHeaders(req, accessToken),
        ...forwardedHeaders,
      },
      body,
    });

  try {
    let refreshed: Awaited<ReturnType<typeof refreshSession>> = null;

    // A school must still be disabled at request time. The backend must enforce
    // this atomically as well, since its API can be called outside this proxy.
    if (req.method === "DELETE" && /^\/tenant\/[^/]+\/?$/.test(path)) {
      let current = await fetch(url, { method: "GET", headers: authHeaders(req) });
      if (current.status === 401 && hasSession(req)) {
        refreshed = await refreshSession(req);
        if (refreshed) {
          current = await fetch(url, { method: "GET", headers: authHeaders(req, refreshed.accessToken) });
        }
      }
      if (!current.ok) {
        const response = NextResponse.json({ message: "Could not verify the school's current status." }, { status: current.status });
        if (refreshed) applySession(response, refreshed.setCookies, refreshed.body);
        return response;
      }
      const result = await current.json();
      const school = result && typeof result === "object" && "data" in result ? result.data : result;
      if (!school || typeof school !== "object" || !("status" in school) || school.status !== 0) {
        return NextResponse.json({ message: "Only disabled schools can be deleted." }, { status: 409 });
      }
    }

    let res = await send(refreshed?.accessToken);

    if (res.status === 401 && hasSession(req) && !refreshed) {
      refreshed = await refreshSession(req);
      if (refreshed) res = await send(refreshed.accessToken);
    }

    if (process.env.NODE_ENV === "development") {
      const note = refreshed ? " (after token refresh)" : "";
      console.log(`[proxy] ${req.method} ${path}${req.nextUrl.search} → ${res.status}${note}`);
    }

    const response = new NextResponse(res.body, {
      status: res.status,
      headers: Object.fromEntries(
        ["content-type", "content-disposition", "cache-control"]
          .map((name) => [name, res.headers.get(name)] as const)
          .filter((entry): entry is readonly [string, string] => !!entry[1])
      ),
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
