// Server-only: the signed-in user's session, read from the auth cookies.

import { cookies } from "next/headers";
import { decodeSession } from "@/lib/access";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-constants";

export async function getSession() {
  const jar = await cookies();
  return decodeSession(jar.get(ACCESS_TOKEN_COOKIE)?.value);
}
