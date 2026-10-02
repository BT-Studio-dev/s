export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Deterministic (UTC) date label — identical on server and client, no hydration drift. */
export function formatJoined(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function timeAgo(iso: string | null | undefined, now: number): string {
  if (!iso) return "never";
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatJoined(iso);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatMb(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${gb >= 10 || Number.isInteger(gb) ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** FNV-1a 32-bit — stable seed for per-server simulated telemetry. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function isVideoUrl(url: string): boolean {
  return url.startsWith("data:video/") || /\.(mp4|webm|ogv|mov|mkv|m4v)(\?|#|$)/i.test(url);
}

/** Wallpaper media the upload box accepts, mirrored by saveMedia on the server. */
export const WALLPAPER_ACCEPT = "image/*,video/mp4,video/webm,video/ogg,video/quicktime,.gif,.mp4,.webm,.mov";

const VIDEO_EXT = /\.(mp4|webm|ogv|mov|mkv|m4v)(\?|#|$)/i;

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || VIDEO_EXT.test(file.name);
}

export function isGifFile(file: File): boolean {
  return file.type === "image/gif" || /\.gif(\?|#|$)/i.test(file.name);
}

export function isSvgFile(file: File): boolean {
  return file.type === "image/svg+xml" || /\.svg(\?|#|$)/i.test(file.name);
}

/** Read a file as a data URL without re-encoding it. Needed for GIF and video:
 *  a canvas round-trip would drop the animation (and cannot read video at all). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function toHexColor(value: string | undefined | null, fallback: string): string {
  const v = (value ?? "").trim();
  const six = v.match(/^#?([0-9a-f]{6})$/i);
  if (six) return `#${six[1].toLowerCase()}`;
  const three = v.match(/^#?([0-9a-f]{3})$/i);
  if (three) return `#${three[1].split("").map((c) => c + c).join("").toLowerCase()}`;
  return fallback;
}

export function hexToRgbTriplet(hex: string): string {
  const n = parseInt(toHexColor(hex, "#0c1424").slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Downscale an image file in the browser and return a data URL. */
export async function compressImageFile(
  file: File,
  maxSize: number,
  quality = 0.85,
  type: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that image."));
      el.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable.");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL(type, quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── Session token fallback ─────────────────────────────────────────────────
// The HttpOnly cookie is the primary session carrier. Browsers that block
// third-party cookies inside an embedded preview iframe (e.g. Safari) never
// send it, so the token is also kept here and sent as a Bearer header.
const TOKEN_KEY = "btpanel.session";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string | null | undefined) {
  if (typeof window === "undefined" || !token) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — cookie session still works */
  }
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

// ── Dashboard cache ────────────────────────────────────────────────────────
// The signed-in payload is cached so a page load can paint Home instantly —
// no "opening panel" loading screen and no round trip in front of the user.
const CACHE_KEY = "btpanel.cache";

export function cachePanel(data: unknown) {
  if (typeof window === "undefined" || !data) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* storage full/unavailable — the loading-free path is a nicety */
  }
}

export function getCachedPanel<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    const ok =
      !!data &&
      typeof data === "object" &&
      "profile" in data &&
      "settings" in data &&
      Array.isArray((data as { servers?: unknown }).servers) &&
      Array.isArray((data as { team?: unknown }).team);
    return ok ? (data as T) : null;
  } catch {
    return null;
  }
}

export function clearCachedPanel() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/** JSON fetch helper — throws an Error carrying the server's message. */
export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  // State-changing requests require this custom header; cross-origin browser
  // requests then need a CORS preflight, which this API does not authorize.
  const headers: Record<string, string> = { "x-btp-csrf": "1", "Content-Type": "application/json" };
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}
