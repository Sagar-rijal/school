import { NextResponse } from "next/server";

const AUTH_COOKIES = ["access-token", "refresh-token"];

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  for (const name of AUTH_COOKIES) {
    response.cookies.delete(name);
  }
  return response;
}
