import { NextRequest, NextResponse } from "next/server";
import { authHeaders, backendUrl, clearSession } from "@/lib/server/backend";

/** Revoke the backend session, then remove local cookies even if the server is offline. */
export async function POST(req: NextRequest) {
  try {
    await fetch(backendUrl("/auth/logout"), {
      method: "POST",
      headers: authHeaders(req),
      cache: "no-store",
    });
  } catch {
    // Removing the local cookies still signs this browser out.
  }
  const response = NextResponse.json({ message: "Logged out" });
  clearSession(response);
  return response;
}
