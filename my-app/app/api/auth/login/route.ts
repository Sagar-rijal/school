import { NextRequest, NextResponse } from "next/server";
import {
  applySession,
  backendUrl,
  describeShape,
  extractUser,
  parseJson,
} from "@/lib/server/backend";

/**
 * Logs in through the backend and stores the session in httpOnly cookies on this site.
 * Works whether the backend returns tokens as cookies or in the JSON body.
 */
export async function POST(req: NextRequest) {
  let res: Response;
  try {
    res = await fetch(backendUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
    });
  } catch (err) {
    console.error("[auth] login request failed:", err);
    return NextResponse.json({ message: "Could not reach the backend server" }, { status: 502 });
  }

  const text = await res.text();
  const body = parseJson(text);

  if (!res.ok) {
    // Pass the backend's error (e.g. wrong password) straight through
    return new NextResponse(text || null, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  }

  const setCookies = res.headers.getSetCookie();
  if (process.env.NODE_ENV === "development") {
    // Shape only (no values) — used to confirm the undocumented login response format
    console.log("[auth] login response:", describeShape(body), {
      cookies: setCookies.map((c) => c.split("=")[0]),
    });
  }

  const response = NextResponse.json({ user: extractUser(body) });
  const accessToken = applySession(response, setCookies, body);

  if (!accessToken) {
    return NextResponse.json(
      { message: "Login succeeded, but the server didn't return an access token in a recognised format." },
      { status: 502 }
    );
  }

  return response;
}
