import { cookies } from "next/headers";
import "./globals.css";
// Glass surfaces live in their own sheet; imported after globals so the glass
// rules keep winning over the base component layer for equal specificity.
import "./glass.css";
import { MODE_COOKIE, parseMode, themeVars } from "@/lib/panel/theme";
import { DEFAULT_SETTINGS, pickTheme } from "@/lib/panel/types";
import { getSettingsSafe } from "@/lib/server/data";
export const dynamic = "force-dynamic";
async function loadSettings() {
  try {
    return await getSettingsSafe();
  } catch (err) {
    console.error("[bt-panel] settings unavailable, using defaults", err);
    return DEFAULT_SETTINGS;
  }
}
export async function generateMetadata() {
  await cookies();
  const settings = await loadSettings();
  return {
    title: settings.faviconTitle || settings.panelName || "BT Panel",
    description:
      "Next-generation glassmorphism control panel for game and application server management.",
    icons: {
      icon: settings.faviconLogo || "/favicon.svg",
    },
  };
}
export default async function RootLayout({ children }) {
  const store = await cookies();
  const settings = await loadSettings();
  const mode = parseMode(store.get(MODE_COOKIE)?.value) ?? settings.mode;
  const vars = themeVars(pickTheme(settings), mode);
  return (
    <html lang="en" data-theme-mode={mode} style={vars} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800;6..12,900&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
