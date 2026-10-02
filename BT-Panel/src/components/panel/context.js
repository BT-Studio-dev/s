"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import {
  applyFavicon,
  applyTheme,
  getLocalModeOverride,
  setLocalModeOverride,
} from "@/lib/panel/theme";
import {
  isAdminRole,
  pickTheme,
  resolveSettingsTab,
  resolveView,
  PANEL_VIEWS,
} from "@/lib/panel/types";
import { parseLanguage, translate } from "@/lib/panel/i18n";
import { api, clearCachedPanel, clearStoredToken } from "@/lib/utils";
const PanelContext = createContext(null);
export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel must be used inside <PanelProvider>");
  return ctx;
}
const COLLAPSED_KEY = "btpanel.sidebar-collapsed";
const LANGUAGE_KEY = "btpanel.language";
function readStoredLanguage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LANGUAGE_KEY);
    return raw ? parseLanguage(raw) : null;
  } catch {
    return null;
  }
}
const COLLAPSED_EVENT = "btpanel:sidebar-collapsed";
function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}
function readCollapsedServer() {
  return false;
}
function subscribeCollapsed(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSED_EVENT, onChange);
  };
}
function writeCollapsed(next) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(COLLAPSED_EVENT));
}
function syncUrl(view) {
  const params = new URLSearchParams();
  if (view !== "home") params.set("view", view);
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
}

/** Real, shareable path for a view — used for the address bar only, never fetched. */
function pathForView(view, settingsTab) {
  if (view === "home") return "/";
  if (view === "settings") return `/settings/${settingsTab}`;
  return `/${view}`;
}

/** Inverse of {@link pathForView}: read a view (and settings tab) back off the URL. */
function readViewFromLocation() {
  const { pathname, search } = window.location;
  const [head, tail] = pathname.split("/").filter(Boolean);
  let view = "home";
  let tab = null;
  if (head === "settings") {
    view = "settings";
    tab = resolveSettingsTab(tail);
  } else if (head && PANEL_VIEWS.includes(head)) {
    view = head;
  } else {
    const params = new URLSearchParams(search);
    const q = params.get("view");
    if (q && PANEL_VIEWS.includes(q)) view = q;
  }
  return {
    view,
    tab,
  };
}
export function PanelProvider({
  initial,
  initialView,
  initialModeOverride,
  initialSettingsTab,
  children,
}) {
  const [profile, setProfile] = useState(initial.profile);
  const [settings, setSettings] = useState(initial.settings);
  const [draft, setDraftState] = useState(() => pickTheme(initial.settings));
  const [override, setOverride] = useState(() => getLocalModeOverride() ?? initialModeOverride);
  const [team, setTeam] = useState(initial.team);
  const [servers, setServers] = useState(initial.servers);
  const [nodes, setNodes] = useState(initial.nodes ?? []);
  const [userCount, setUserCount] = useState(initial.userCount);
  const [view, setViewState] = useState(initialView);
  const [settingsTab, setSettingsTabState] = useState(initialSettingsTab ?? "general");
  // Sidebar collapse is persisted in localStorage, which does not exist during
  // SSR. Reading it in a lazy initializer made the first client render disagree
  // with the server HTML (collapsed -> "flex-col" vs "justify-between") and
  // broke hydration. useSyncExternalStore is the supported way to read an
  // external store that differs between server and client: React uses the server
  // snapshot while rendering HTML and switches to the client snapshot afterwards.
  const sidebarCollapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    readCollapsedServer,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  const isAdmin = isAdminRole(profile.role);
  const mode = override ?? draft.mode;

  // ── Theme ──

  useEffect(() => {
    applyTheme(draft, mode);
  }, [draft, mode]);
  useEffect(() => {
    document.title = settings.faviconTitle || settings.panelName || "BT Panel";
    applyFavicon(settings.faviconLogo);
  }, [settings.faviconTitle, settings.panelName, settings.faviconLogo]);
  const setDraft = useCallback((patch) => {
    setDraftState((prev) => ({
      ...prev,
      ...patch,
    }));
  }, []);
  const persistTheme = useCallback(async (extra, opts) => {
    try {
      const res = await api("/api/settings", {
        method: "PUT",
        body: {
          ...draftRef.current,
          ...extra,
        },
      });
      setSettings(res.settings);
      setDraftState(pickTheme(res.settings));
      if (!opts?.quiet) toast.success("Theme saved for everyone");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save theme");
      return false;
    }
  }, []);
  const persistSettings = useCallback(async (patch, message = "Settings saved") => {
    try {
      const res = await api("/api/settings", {
        method: "PUT",
        body: patch,
      });
      setSettings(res.settings);
      toast.success(message);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
      return false;
    }
  }, []);
  const toggleMode = useCallback(() => {
    const darkBase = draftRef.current.mode === "light" ? "dark" : draftRef.current.mode;
    const target = mode === "light" ? darkBase : "light";
    setLocalModeOverride(target);
    setOverride(target);
  }, [mode]);
  const clearModeOverride = useCallback(() => {
    setLocalModeOverride(null);
    setOverride(null);
  }, []);

  // ── Navigation ──
  // Every view is mounted by the shell (src/components/panel/shell.tsx), so
  // switching views only swaps client state and rewrites the address bar with
  // the view's real, shareable path. Nothing here may call window.location:
  // a full navigation tears the app down and reloads it, which is what used to
  // make every "Admin Settings" click look like a restart.
  const navigate = useCallback((view, tab, replace = false) => {
    const url = pathForView(view, tab);
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }, []);
  const setView = useCallback(
    (next) => {
      const allowed = resolveView(next, profile.role);
      setViewState(allowed);
      setMobileOpen(false);
      navigate(allowed, settingsTab);
    },
    [navigate, profile.role, settingsTab],
  );

  // Back/forward must restore the view, otherwise the URL and the rendered
  // view drift apart after the pushState calls above.
  useEffect(() => {
    const onPopState = () => {
      const { view: next, tab } = readViewFromLocation();
      setViewState(resolveView(next, profile.role));
      if (tab) setSettingsTabState(tab);
      setMobileOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [profile.role]);
  const setSettingsTab = useCallback(
    (tab) => {
      const allowed = resolveView("settings", profile.role);
      setSettingsTabState(tab);
      setViewState(allowed);
      navigate(allowed, tab, tab === settingsTab);
    },
    [navigate, profile.role, settingsTab],
  );
  const toggleCollapsed = useCallback(() => {
    writeCollapsed(!readCollapsed());
  }, []);

  // ── Live data ──
  const refresh = useCallback(async () => {
    try {
      const data = await api("/api/panel");
      setTeam(data.team);
      setServers(data.servers);
      setNodes(data.nodes);
      setUserCount(data.userCount);
      const me = data.team.find((m) => m.userId === initial.profile.userId);
      if (me)
        setProfile((prev) => ({
          ...prev,
          online: true,
          lastSeen: me.lastSeen,
        }));
    } catch (err) {
      if (err instanceof Error && /session has expired/i.test(err.message)) {
        clearStoredToken();
        clearCachedPanel();
        window.location.assign("/login");
      }
    }
  }, [initial.profile.userId]);
  const transitional = servers.some((s) => s.status === "starting" || s.status === "stopping");
  useEffect(() => {
    const id = window.setInterval(
      () => {
        if (!document.hidden) void refresh();
      },
      transitional ? 1500 : 15000,
    );
    return () => window.clearInterval(id);
  }, [refresh, transitional]);
  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);
  const upsertServer = useCallback((server) => {
    setServers((prev) => {
      const index = prev.findIndex((s) => s.id === server.id);
      if (index === -1) return [...prev, server];
      const next = prev.slice();
      next[index] = server;
      return next;
    });
  }, []);
  const signOut = useCallback(async () => {
    try {
      await api("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      /* ignore */
    }
    clearStoredToken();
    clearCachedPanel();
    window.location.assign("/login");
  }, []);

  // The panel's default language is an admin setting, so it arrives in the
  // bootstrap payload; a user's own override is kept in localStorage so a
  // shared machine does not fight the admin's choice on every page load.
  const [language, setLanguageState] = useState(
    () => readStoredLanguage() ?? initial.settings.defaultLanguage,
  );
  // When the admin changes the panel default, adopt it — unless this user has
  // deliberately picked a language, which is what the stored override means.
  // Adjusting during render (rather than in an effect) is React's documented
  // pattern for reacting to a changed prop without a wasted second render.
  const [adminDefault, setAdminDefault] = useState(initial.settings.defaultLanguage);
  if (adminDefault !== initial.settings.defaultLanguage) {
    setAdminDefault(initial.settings.defaultLanguage);
    if (!readStoredLanguage()) setLanguageState(initial.settings.defaultLanguage);
  }
  const t = useCallback((key) => translate(language, key), [language]);
  const setLanguage = useCallback((next) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const value = {
    profile,
    setProfile,
    settings,
    draft,
    setDraft,
    persistTheme,
    persistSettings,
    mode,
    toggleMode,
    clearModeOverride,
    team,
    setTeam,
    servers,
    setServers,
    upsertServer,
    nodes,
    setNodes,
    userCount,
    isAdmin,
    view,
    setView,
    settingsTab,
    setSettingsTab,
    sidebarCollapsed,
    toggleCollapsed,
    mobileOpen,
    setMobileOpen,
    refresh,
    signOut,
    t,
    language,
    setLanguage,
  };
  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
}
