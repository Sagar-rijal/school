import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://75p9bgvb-8081.inc1.devtunnels.ms/api/v1/school-backend";

async function proxy(req: NextRequest) {
  
 let path = req.nextUrl.pathname.replace("/api/v1/school-backend", "");
 if (path.startsWith("/tenant") && !path.endsWith("/")) {
    path = `${path}/`;
  }
const url = `${BACKEND}${path}`;

  console.log("→", req.method, url);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(req.headers.get("cookie") ? { Cookie: req.headers.get("cookie")! } : {}),
  };

  const init: RequestInit = { method: req.method, headers };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const body = await res.text();

    console.log("←", res.status, url);
    console.log("← body:", body.slice(0, 200));

    const response = new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });

    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append("Set-Cookie", value);
      }
    });

    return response;

  } catch (err) {
    console.error("PROXY ERROR:", err);
    return NextResponse.json(
      { error: "Proxy failed", detail: String(err) },
      { status: 500 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;