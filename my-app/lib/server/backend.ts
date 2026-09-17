// Server-only helpers for talking to the FastAPI backend and managing the session cookies.
// Used by app/api route handlers — never import this from client components.

import type { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth-constants";

export const BACKEND_PREFIX = "/api/v1/school-backend";

const isProduction = process.env.NODE_ENV === "production";
const ONE_DAY = 60 * 60 * 24;

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function backendUrl(path: string) {
  const base = process.env.BACKEND_URL;
  if (!base) throw new Error("BACKEND_URL is not configured in .env.local");
  return `${base.replace(/\/$/, "")}${BACKEND_PREFIX}${path}`;
}

export function parseJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// ── Tokens in response bodies ──
// The spec doesn't document the login/refresh responses, so tokens are looked for
// in the common places: top level, `data`, and `data.tokens` / `tokens`.

const TOKEN_KEYS = {
  access: ["access_token", "accessToken", "access-token", "token"],
  refresh: ["refresh_token", "refreshToken", "refresh-token"],
};

function tokenContainers(body: unknown): Json[] {
  if (!isObject(body)) return [];
  const data = body.data;
  return [body, data, isObject(data) ? data.tokens : undefined, body.tokens].filter(isObject);
}

export function findToken(body: unknown, kind: keyof typeof TOKEN_KEYS): string | undefined {
  for (const container of tokenContainers(body)) {
    for (const key of TOKEN_KEYS[kind]) {
      if (typeof container[key] === "string") return container[key];
    }
  }
}

/** Pulls basic user info out of the login response, wherever it is. */
export function extractUser(body: unknown) {
  if (!isObject(body)) return null;
  const data = body.data;
  const candidates = [isObject(data) ? data.user : undefined, body.user, data, body].filter(isObject);
  const user = candidates.find((c) => "email" in c || "name" in c || "_id" in c || "user_id" in c);
  if (!user) return null;

  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    id: str(user._id) ?? str(user.id) ?? str(user.user_id),
    name: str(user.name),
    email: str(user.email),
  };
}

/** Top-level and `data` keys only — for checking the response format without logging secrets. */
export function describeShape(body: unknown) {
  if (!isObject(body)) return typeof body;
  const data = body.data;
  return { keys: Object.keys(body), dataKeys: isObject(data) ? Object.keys(data) : typeof data };
}

// ── Cookies ──

function secondsUntilJwtExpiry(token: string): number | undefined {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    if (typeof payload.exp === "number") {
      return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    }
  } catch {
    // not a JWT
  }
}

function serializeCookie(name: string, value: string, maxAge: number) {
  const parts = [`${name}=${value}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (isProduction) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookieHeader(name: string) {
  return `${name}=; Path=/; Max-Age=0`;
}

const SESSION_COOKIES = [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE];

/**
 * Makes a backend Set-Cookie usable on this site: drops Domain (it would name the
 * backend's host, so the browser rejects it) and forces Path=/. In development,
 * also drops Secure so cookies work on http://localhost.
 *
 * Session cookies are forced to HttpOnly — the backend omits it, which would let any
 * script on the page read the tokens.
 */
export function sanitizeSetCookie(cookie: string) {
  let parts = cookie
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p && !/^domain=/i.test(p))
    .map((p) => (/^path=/i.test(p) ? "Path=/" : p));

  const name = parts[0]?.split("=")[0]?.trim();
  if (SESSION_COOKIES.includes(name) && !parts.some((p) => /^httponly$/i.test(p))) {
    parts.push("HttpOnly");
  }

  if (!isProduction) {
    // Over plain http a cookie is rejected outright if it keeps Secure, SameSite=None or Partitioned
    parts = parts
      .filter((p) => !/^(secure|partitioned)$/i.test(p))
      .map((p) => (/^samesite=none$/i.test(p) ? "SameSite=Lax" : p));
  }
  return parts.join("; ");
}

export function readSetCookie(setCookies: string[], name: string): string | undefined {
  for (const cookie of setCookies) {
    const pair = cookie.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0 && pair.slice(0, eq).trim() === name) {
      const value = pair.slice(eq + 1).trim();
      return value || undefined;
    }
  }
}

/**
 * Copies the backend's session onto our response, whether the backend sent the tokens
 * as cookies or in the JSON body. Returns the access token, if any.
 *
 * Only raw `Set-Cookie` headers are used (not `response.cookies`), because the
 * NextResponse cookie helper rewrites the header and would drop cookies appended manually.
 */
export function applySession(response: NextResponse, setCookies: string[], body: unknown) {
  for (const cookie of setCookies) {
    response.headers.append("Set-Cookie", sanitizeSetCookie(cookie));
  }

  const accessFromCookie = readSetCookie(setCookies, ACCESS_TOKEN_COOKIE);
  const refreshFromCookie = readSetCookie(setCookies, REFRESH_TOKEN_COOKIE);
  const accessToken = accessFromCookie ?? findToken(body, "access");
  const refreshToken = refreshFromCookie ?? findToken(body, "refresh");

  if (accessToken && !accessFromCookie) {
    response.headers.append(
      "Set-Cookie",
      serializeCookie(ACCESS_TOKEN_COOKIE, accessToken, secondsUntilJwtExpiry(accessToken) ?? ONE_DAY)
    );
  }
  if (refreshToken && !refreshFromCookie) {
    response.headers.append(
      "Set-Cookie",
      serializeCookie(REFRESH_TOKEN_COOKIE, refreshToken, secondsUntilJwtExpiry(refreshToken) ?? 7 * ONE_DAY)
    );
  }

  return accessToken;
}

export function clearSession(response: NextResponse) {
  response.headers.append("Set-Cookie", clearCookieHeader(ACCESS_TOKEN_COOKIE));
  response.headers.append("Set-Cookie", clearCookieHeader(REFRESH_TOKEN_COOKIE));
}

export function hasSession(req: NextRequest) {
  return req.cookies.has(ACCESS_TOKEN_COOKIE) || req.cookies.has(REFRESH_TOKEN_COOKIE);
}

// ── Outgoing requests ──

/**
 * Auth for backend calls. The spec's /auth/refresh reads an `access-token` header or
 * `Authorization`, so the token is sent all three ways (cookie, header, bearer).
 */
export function authHeaders(req: NextRequest, accessTokenOverride?: string) {
  const headers: Record<string, string> = {};
  const jar = new Map(req.cookies.getAll().map((c) => [c.name, c.value]));
  if (accessTokenOverride) jar.set(ACCESS_TOKEN_COOKIE, accessTokenOverride);

  if (jar.size > 0) {
    headers.Cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  const token = jar.get(ACCESS_TOKEN_COOKIE);
  if (token) {
    headers["access-token"] = token;
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** Calls /auth/refresh. Returns the new session, or null if the session can't be renewed. */
export async function refreshSession(req: NextRequest) {
  try {
    const res = await fetch(backendUrl("/auth/refresh"), {
      method: "POST",
      headers: authHeaders(req),
    });
    if (!res.ok) return null;

    const body = parseJson(await res.text());
    const setCookies = res.headers.getSetCookie();
    const accessToken = readSetCookie(setCookies, ACCESS_TOKEN_COOKIE) ?? findToken(body, "access");
    return accessToken ? { accessToken, setCookies, body } : null;
  } catch {
    return null;
  }
}
