import { NextRequest, NextResponse } from "next/server";

const PREFIX = "/api/v1/school-backend";

async function proxy(req: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ message: "BACKEND_URL is not configured" }, { status: 500 });
  }

  let path = req.nextUrl.pathname.replace(PREFIX, "");
  // The backend defines GET /tenant/ with a trailing slash
  if (path === "/tenant") path = "/tenant/";

  // Keep the query string so filters like ?class_id= reach the backend
  const url = `${backendUrl}${PREFIX}${path}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  const cookie = req.headers.get("cookie");
  const authorization = req.headers.get("authorization");
  if (contentType) headers["Content-Type"] = contentType;
  if (cookie) headers["Cookie"] = cookie;
  if (authorization) headers["Authorization"] = authorization;

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const body = await res.text();

    if (process.env.NODE_ENV === "development") {
      console.log(`[proxy] ${req.method} ${path}${req.nextUrl.search} → ${res.status}`);
    }

    const response = new NextResponse(body || null, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });

    for (const value of res.headers.getSetCookie()) {
      response.headers.append("Set-Cookie", value);
    }

    return response;
  } catch (err) {
    console.error("[proxy] error:", err);
    return NextResponse.json(
      { message: "Could not reach the backend server" },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
