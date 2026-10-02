import { parseShaderWallpaper } from "./catalog";
import { DEFAULT_THEME, parseWallpaperFit } from "./types";
import { clamp, hexToRgbTriplet, isVideoUrl, toHexColor } from "@/lib/utils";

/**
 * Theme engine — converts ThemeSettings into CSS custom properties. Used on
 * the server (inline <html> style, no flash) and on the client (live preview).
 */
export const MODE_COOKIE = "btp_mode";
const MODE_STORAGE_KEY = "btpanel.theme-mode-override";
export function parseMode(value) {
  return value === "dark" || value === "light" ? value : null;
}

// Light scheme replaces the admin-picked glass tint / nav colors.
const LIGHT = {
  tint: "250 251 254",
  nav: "#4e5669",
  navActive: "#13162a",
};
export function themeVars(theme, mode) {
  const accent = toHexColor(theme.accentColor, DEFAULT_THEME.accentColor);
  const url = theme.wallpaperUrl || "";
  const wallpaper =
    url && !parseShaderWallpaper(url) && !isVideoUrl(url)
      ? `url("${url.replace(/["\\\n\r]/g, "")}")`
      : "none";
  const glassBlur = clamp(theme.glassBlur || 0, 0, 60);
  const glassSaturate = theme.glassSaturate || 160;
  // "cover"/"contain"/"stretch" are plain CSS keywords; "tile" is not, so the
  // image layer needs its own size/repeat pair for that one.
  const fit = parseWallpaperFit(theme.wallpaperFit);
  return {
    "--wallpaper-url": wallpaper,
    "--wallpaper-fit": fit === "tile" ? "cover" : fit,
    "--wallpaper-fit-size": fit === "tile" ? "auto" : fit,
    "--wallpaper-fit-repeat": fit === "tile" ? "repeat" : "no-repeat",
    "--wallpaper-zoom": String(clamp(theme.wallpaperZoom ?? 100, 100, 300) / 100),
    "--bg-blur": `${clamp(theme.bgBlur || 0, 0, 100)}px`,
    "--bg-opacity": String(
      clamp(Number.isFinite(theme.bgOpacity) ? theme.bgOpacity : 100, 0, 100) / 100,
    ),
    "--accent": accent,
    "--accent-glow": `color-mix(in srgb, ${accent} 34%, transparent)`,
    "--glass-tint": mode === "light" ? LIGHT.tint : hexToRgbTriplet(theme.glassTint),
    "--nav-text": mode === "light" ? LIGHT.nav : toHexColor(theme.navText, DEFAULT_THEME.navText),
    "--nav-text-active":
      mode === "light"
        ? LIGHT.navActive
        : toHexColor(theme.navTextActive, DEFAULT_THEME.navTextActive),
    "--glass-blur": `${glassBlur}px`,
    "--glass-saturate": `${glassSaturate}%`,
    // Whole-value form: CSS optimisation drops `blur(var(--x)) saturate(var(--y))`
    // from the bundle, which silently disabled the Glass Blur control.
    "--glass-filter": `blur(${glassBlur}px) saturate(${glassSaturate}%)`,
    "--panel-radius": `${clamp(theme.borderRadius ?? 16, 0, 32)}px`,
    "--glass-opacity": String(
      clamp(
        Number.isFinite(theme.glassOpacity) ? theme.glassOpacity : DEFAULT_THEME.glassOpacity,
        0,
        100,
      ) / 100,
    ),
  };
}
export function getLocalModeOverride() {
  if (typeof window === "undefined") return null;
  try {
    const stored = parseMode(window.localStorage.getItem(MODE_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    /* storage unavailable */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${MODE_COOKIE}=([^;]*)`));
  return parseMode(match?.[1]);
}
export function setLocalModeOverride(mode) {
  if (typeof window === "undefined") return;
  try {
    if (mode) window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    else window.localStorage.removeItem(MODE_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
  const secure = window.location.protocol === "https:";
  const attrs = secure ? "; SameSite=None; Secure; Partitioned" : "; SameSite=Lax";
  document.cookie = mode
    ? `${MODE_COOKIE}=${mode}; Path=/; Max-Age=31536000${attrs}`
    : `${MODE_COOKIE}=; Path=/; Max-Age=0${attrs}`;
}
export function applyTheme(theme, mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.themeMode = mode;
  const vars = themeVars(theme, mode);
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
}
export function applyFavicon(faviconUrl) {
  if (typeof document === "undefined") return;
  const href = faviconUrl.trim() || "/favicon.svg";
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = href;
}
