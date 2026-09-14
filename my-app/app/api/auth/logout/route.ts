import { NextResponse } from "next/server";
import { clearSession } from "@/lib/server/backend";

// The backend has no logout endpoint, so logging out means clearing our session cookies.
export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  clearSession(response);
  return response;
}
