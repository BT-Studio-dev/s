import { cache } from "react";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, gt, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { isAdminRole } from "@/lib/panel/types";
import { HttpError, newToken, sha256 } from "./core";
import { ensureDatabase, type UserRow } from "./data";

export const SESSION_COOKIE = "btp_session";
export const CSRF_HEADER = "x-btp-csrf";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;

export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  return { token, expiresAt };
}

/**
 * Session token candidates, in priority order: the HttpOnly cookie, then an
 * `Authorization: Bearer` header. The header path keeps the panel usable when
 * a browser blocks third-party cookies inside an embedded preview iframe.
 */
async function sessionTokens(): Promise<string[]> {
  const [store, h] = await Promise.all([cookies(), headers()]);
  const out: string[] = [];
  const fromCookie = store.get(SESSION_COOKIE)?.value;
  if (fromCookie && TOKEN_RE.test(fromCookie)) out.push(fromCookie);
  const bearer = h.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (bearer && TOKEN_RE.test(bearer) && !out.includes(bearer)) out.push(bearer);
  return out;
}

export const getSessionUser = cache(async (): Promise<UserRow | null> => {
  const tokens = await sessionTokens();
  if (!tokens.length) return null;
  await ensureDatabase();
  const hashes = tokens.map(sha256);
  const rows = await db
    .select({ sessionId: sessions.id, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(inArray(sessions.id, hashes), gt(sessions.expiresAt, new Date())));
  for (const hash of hashes) {
    const match = rows.find((r) => r.sessionId === hash);
    if (match && match.user.status === "active") return match.user;
  }
  return null;
});

export async function destroyCurrentSession() {
  const tokens = await sessionTokens();
  if (tokens.length) await db.delete(sessions).where(inArray(sessions.id, tokens.map(sha256)));
}

/** Revoke other devices after a password change, retaining this request's session. */
export async function destroyOtherSessions(userId: string) {
  const tokens = await sessionTokens();
  const hashes = tokens.map(sha256);
  if (hashes.length) {
    await db.delete(sessions).where(and(eq(sessions.userId, userId), notInArray(sessions.id, hashes)));
  } else {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}

/**
 * Is the *browser* on https? TLS usually terminates at a proxy, so the Node
 * request URL says http. The browser-supplied Origin/Referer is ground truth;
 * proxy headers are only a fallback. COOKIE_SECURE=true|false overrides.
 */
function isHttps(req: Request): boolean {
  const forced = process.env.COOKIE_SECURE?.toLowerCase();
  if (forced === "true" || forced === "1") return true;
  if (forced === "false" || forced === "0") return false;
  const h = req.headers;
  const origin = h.get("origin");
  if (origin && origin !== "null") return origin.startsWith("https://");
  const referer = h.get("referer");
  if (referer) return referer.startsWith("https://");
  const proto = h.get("x-forwarded-proto") ?? h.get("x-forwarded-scheme");
  if (proto) return proto.split(",")[0].trim().toLowerCase() === "https";
  if (h.get("x-forwarded-ssl")?.toLowerCase() === "on") return true;
  if (/proto=https/i.test(h.get("forwarded") ?? "")) return true;
  return new URL(req.url).protocol === "https:";
}

/** Use an operator-configured origin for OAuth in production, avoiding Host-header-based redirect URI injection. */
export function publicOrigin(req: Request): string {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new HttpError(500, "Set PUBLIC_BASE_URL to the canonical panel origin before enabling Google sign-in.");
    }
    return new URL(req.url).origin;
  }
  try {
    const url = new URL(configured);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) throw new Error();
    return url.origin;
  } catch {
    throw new HttpError(500, "PUBLIC_BASE_URL must be a valid absolute HTTP(S) URL.");
  }
}

/** SameSite=None + Secure + Partitioned on https so sign-in also works inside embedded (cross-site) previews. */
function cookieBase(req: Request) {
  const secure = isHttps(req);
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    path: "/",
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    partitioned: secure,
  };
}

export function setSessionCookie(res: NextResponse, req: Request, token: string, expires: Date) {
  res.cookies.set({ ...cookieBase(req), value: token, expires });
}

export function clearSessionCookie(res: NextResponse, req: Request) {
  res.cookies.set({ ...cookieBase(req), value: "", expires: new Date(0) });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function requireUser(): Promise<UserRow> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Your session has expired — sign in again.");
  return user;
}

export async function requireAdmin(): Promise<UserRow> {
  const user = await requireUser();
  if (!isAdminRole(user.role)) throw new HttpError(403, "Administrator permission required.");
  return user;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF guard for state-changing requests. Content-Type is not a CSRF token:
 * browsers can issue a cross-site text/plain fetch whose body is valid JSON,
 * and readBody parses it regardless of that header. Requiring this custom
 * header forces cross-origin fetches through a CORS preflight that we do not
 * approve; same-origin UI calls attach it in the shared api() helper.
 */
export async function handle(req: Request, fn: () => Promise<Response>): Promise<Response> {
  try {
    if (!SAFE_METHODS.has(req.method.toUpperCase())) {
      if (req.headers.get(CSRF_HEADER) !== "1") {
        throw new HttpError(403, "Request blocked — please reload the panel and try again.");
      }
    }
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.message, err.status);
    console.error("[bt-panel]", err);
    return jsonError("Something went wrong — please try again.", 500);
  }
}

// ── Attempt limiter (failed logins / password checks) ──────────────────────
const buckets = new Map<string, { count: number; reset: number }>();

export function clientKey(req: Request): string {
  // The bundled nginx config overwrites X-Real-IP with $remote_addr. Prefer it
  // over X-Forwarded-For, whose leftmost value may be supplied by a client.
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  return forwarded?.at(-1) || "local";
}

export function assertNotLimited(key: string, max: number) {
  const entry = buckets.get(key);
  if (entry && entry.reset > Date.now() && entry.count >= max) {
    throw new HttpError(429, "Too many attempts — wait a few minutes and try again.");
  }
}

export function recordAttempt(key: string, windowMs = 10 * 60_000) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.reset < now) buckets.set(key, { count: 1, reset: now + windowMs });
  else entry.count += 1;
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    // Unique forged identifiers must not let failed-login attempts grow this
    // process-local map without bound.
    while (buckets.size > 5000) buckets.delete(buckets.keys().next().value!);
  }
}

export function clearAttempts(key: string) {
  buckets.delete(key);
}
