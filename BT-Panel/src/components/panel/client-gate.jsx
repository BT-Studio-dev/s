"use client";

import { useEffect, useState } from "react";
import { getLocalModeOverride } from "@/lib/panel/theme";
import { resolveSettingsTab, resolveView } from "@/lib/panel/types";
import {
  api,
  cachePanel,
  clearCachedPanel,
  clearStoredToken,
  getCachedPanel,
  getStoredToken,
} from "@/lib/utils";
import { PanelShell } from "./shell";
import { WallpaperLayer } from "./wallpaper-layer";
const TIMEOUT_MS = 12_000;
function readReady(data, initialView, initialSettingsTab) {
  const params = new URLSearchParams(window.location.search);
  const view = resolveView(params.get("view"), data.profile.role);
  return {
    data,
    view:
      initialView && resolveView(initialView, data.profile.role) === initialView
        ? initialView
        : view,
    mode: getLocalModeOverride(),
    settingsTab: resolveSettingsTab(initialSettingsTab),
  };
}
function bail() {
  clearStoredToken();
  clearCachedPanel();
  window.location.replace("/login");
}

/**
 * Rendered by `/` when the server saw no session cookie (third-party cookies
 * are blocked in embedded previews, so the session lives in a Bearer token).
 *
 * There is deliberately NO loading screen here: the dashboard signed into
 * last is cached, so Home paints immediately and the network call only
 * refreshes it in the background. If the session is gone or the call times
 * out, we leave for sign-in instead of showing a spinner.
 */
export function ClientGate({ theme, initialView, initialSettingsTab }) {
  const cached = getCachedPanel();
  const [ready, setReady] = useState(() =>
    cached ? readReady(cached, initialView, initialSettingsTab) : null,
  );
  useEffect(() => {
    if (!getStoredToken()) {
      window.location.replace("/login");
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled && !cached) bail();
    }, TIMEOUT_MS);
    api("/api/bootstrap")
      .then((data) => {
        if (cancelled) return;
        window.clearTimeout(timer);
        cachePanel(data);
        setReady(readReady(data, initialView, initialSettingsTab));
      })
      .catch(() => {
        if (cancelled) return;
        window.clearTimeout(timer);
        if (!cached) bail();
        else clearStoredToken(); // cache stays on screen; refresh() will bounce out if the session is really gone
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cached, initialView, initialSettingsTab]);
  if (ready) {
    return (
      <PanelShell
        initial={ready.data}
        initialView={ready.view}
        initialSettingsTab={ready.settingsTab}
        initialModeOverride={ready.mode}
      />
    );
  }

  // No cached dashboard to paint: just the background while it is fetched.
  return (
    <div className="relative min-h-dvh" aria-busy="true">
      <WallpaperLayer theme={theme} />
    </div>
  );
}
