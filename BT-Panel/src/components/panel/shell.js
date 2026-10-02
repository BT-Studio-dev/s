"use client";

import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import {
  ChevronDown,
  House,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
  Boxes,
  Globe,
  HardDrive,
  KeyRound,
  Languages,
  Network,
  Server,
} from "lucide-react";
import { LANGUAGES } from "@/lib/panel/i18n";
import { cn } from "@/lib/utils";
import { PanelProvider, usePanel } from "./context";
import { BrandMark, PresenceAvatar } from "./ui";
import { WallpaperLayer } from "./wallpaper-layer";
import { HomeView } from "./views/home-view";
import { SettingsView } from "./views/settings-view";
import { UsersView } from "./views/users-view";
import { AccountView } from "./views/account-view";
import { TeamView } from "./views/misc-views";
import { LocationsView } from "./views/locations-view";
import { NodesView } from "./views/nodes-view";
import { ApplicationApiView } from "./views/api-view";
import { NestsView } from "./views/nests-view";
import { MountsView } from "./views/mounts-view";
import { ServersView } from "./views/servers-view";
/**
 * Sidebar groups mirror the classic admin-panel layout: a single basic entry,
 * the everyday management views, then the service controls an admin owns.
 * Groups render in this order and an empty one is skipped entirely, so a
 * member never sees a header with nothing under it.
 */
const NAV_GROUPS = [
  {
    id: "basic",
    label: "Basic Administration",
    labelKey: "group.basic",
  },
  {
    id: "management",
    label: "Management",
    labelKey: "group.management",
  },
  {
    id: "service",
    label: "Service Management",
    labelKey: "group.service",
    adminOnly: true,
  },
  {
    id: "account",
    label: "Account",
    labelKey: "group.account",
  },
];
const NAV = [
  {
    id: "home",
    label: "Overview",
    icon: House,
    group: "basic",
    labelKey: "nav.overview",
  },
  {
    id: "servers",
    label: "Servers",
    icon: Server,
    group: "basic",
    labelKey: "nav.servers",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    group: "basic",
    labelKey: "nav.settings",
    adminOnly: true,
  },
  {
    id: "locations",
    label: "Locations",
    icon: Globe,
    group: "management",
    labelKey: "nav.locations",
    adminOnly: true,
  },
  {
    id: "nodes",
    label: "Nodes",
    icon: Network,
    group: "management",
    labelKey: "nav.nodes",
  },
  {
    id: "mounts",
    label: "Mounts",
    icon: HardDrive,
    group: "management",
    labelKey: "nav.mounts",
    adminOnly: true,
  },
  {
    id: "nests",
    label: "Nests",
    icon: Boxes,
    group: "service",
    labelKey: "nav.nests",
  },
  {
    id: "users",
    label: "Users",
    icon: ShieldCheck,
    group: "service",
    labelKey: "nav.users",
  },
  {
    id: "apikeys",
    label: "Application API",
    icon: KeyRound,
    group: "service",
    labelKey: "nav.apikeys",
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    group: "account",
    labelKey: "nav.team",
  },
  {
    id: "account",
    label: "My Account",
    icon: UserRound,
    group: "account",
    labelKey: "nav.account",
  },
];
const TITLES = {
  home: "Overview",
  servers: "Servers",
  team: "Team",
  settings: "Admin Settings",
  users: "User Management",
  account: "My Account",
  nodes: "Nodes",
  locations: "Locations",
  apikeys: "Application API",
  nests: "Nests",
  mounts: "Mounts",
};
export function PanelShell({
  initial,
  initialView,
  initialModeOverride,
  initialSettingsTab,
  initialServerId,
}) {
  return (
    <PanelProvider
      initial={initial}
      initialView={initialView}
      initialModeOverride={initialModeOverride}
      initialSettingsTab={initialSettingsTab}
      initialServerId={initialServerId}
    >
      <ShellInner />
    </PanelProvider>
  );
}
function ShellInner() {
  const { draft, view, mode } = usePanel();
  return (
    <div className="relative h-dvh overflow-hidden">
      <WallpaperLayer theme={draft} />
      <div className="relative z-10 flex h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main
            id="main"
            tabIndex={-1}
            className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-10 md:px-6"
          >
            <div key={view} className="view-enter mx-auto w-full max-w-[1600px]">
              {view === "home" ? <HomeView /> : null}
              {view === "servers" ? <ServersView /> : null}
              {view === "team" ? <TeamView /> : null}
              {view === "settings" ? <SettingsView /> : null}
              {view === "users" ? <UsersView /> : null}
              {view === "account" ? <AccountView /> : null}
              {view === "nodes" ? <NodesView /> : null}
              {view === "locations" ? <LocationsView /> : null}
              {view === "apikeys" ? <ApplicationApiView /> : null}
              {view === "nests" ? <NestsView /> : null}
              {view === "mounts" ? <MountsView /> : null}
            </div>
          </main>
        </div>
      </div>
      <Toaster
        theme={mode === "light" ? "light" : "dark"}
        position="top-right"
        offset={{
          top: 72,
          right: 20,
        }}
        toastOptions={{
          style: {
            background: "rgb(var(--glass-tint) / 0.92)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-primary)",
            backdropFilter: "blur(16px)",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            borderRadius: "12px",
          },
        }}
      />
    </div>
  );
}
function Sidebar() {
  const {
    profile,
    settings,
    isAdmin,
    view,
    setView,
    servers,
    sidebarCollapsed,
    toggleCollapsed,
    mobileOpen,
    setMobileOpen,
    signOut,
    t,
  } = usePanel();
  const collapsed = sidebarCollapsed && !mobileOpen;
  const visible = NAV.filter((item) => {
    const group = NAV_GROUPS.find((g) => g.id === item.group);
    if (group?.adminOnly && !isAdmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });
  const renderItem = (item) => (
    <NavButton
      key={item.id}
      item={item}
      active={view === item.id}
      collapsed={collapsed}
      badge={item.id === "servers" ? String(servers.length) : undefined}
      onClick={() => setView(item.id)}
    />
  );
  return (
    <>
      {/* Keyboard users otherwise have to tab through the whole nav on every
          page load. Visually hidden until focused. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-[10px] focus:border focus:border-line focus:bg-fill-strong focus:px-3 focus:py-2 focus:text-[13px] focus:font-extrabold focus:text-ice"
      >
        {t("nav.skip")}
      </a>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          "glass glass-strong fixed inset-y-0 left-0 z-40 flex flex-col rounded-l-none border-y-0 border-l-0 p-4 transition-[width,transform] duration-200 md:static md:translate-x-0",
          collapsed ? "w-[78px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div
          className={cn("mb-4 flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandMark
              className="size-9 shrink-0 drop-shadow-[0_0_14px_var(--accent-glow)]"
              src={settings.panelLogo || undefined}
            />
            {!collapsed ? (
              <div className="min-w-0">
                <div className="truncate text-[15px] font-extrabold tracking-tight">
                  {settings.panelName}
                </div>
                {settings.panelSubtitle ? (
                  <div className="truncate text-[10px] font-bold tracking-[0.14em] text-steel uppercase">
                    {settings.panelSubtitle}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="hidden size-8 shrink-0 items-center justify-center rounded-[9px] border border-line-strong bg-sunken text-steel transition-colors hover:text-ice md:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
          >
            <Menu className="size-4" />
          </button>
        </div>

        <nav className="scrollbar-thin flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {NAV_GROUPS.map((group) => {
            if (group.adminOnly && !isAdmin) return null;
            const items = visible.filter((item) => item.group === group.id);
            if (items.length === 0) return null;
            return (
              <div key={group.id}>
                <SectionLabel collapsed={collapsed}>{t(group.labelKey)}</SectionLabel>
                {items.map(renderItem)}
              </div>
            );
          })}
        </nav>

        <div className="mt-3 border-t border-line pt-3">
          <button
            type="button"
            className={cn(
              "mb-2 flex w-full items-center gap-2.5 rounded-[12px] p-1.5 text-left transition-colors hover:bg-fill",
              collapsed && "justify-center",
            )}
            onClick={() => setView("account")}
          >
            <PresenceAvatar name={profile.username} src={profile.profilePic} size="sm" online />
            {!collapsed ? (
              <div className="min-w-0">
                <div className="truncate text-[13px] font-extrabold">{profile.username}</div>
                <div className="text-[10px] font-bold tracking-[0.14em] text-steel uppercase">
                  {profile.role}
                </div>
              </div>
            ) : null}
          </button>
          <button
            type="button"
            className={cn(
              "nav-item text-danger hover:text-danger",
              collapsed && "justify-center px-2.5",
            )}
            onClick={() => void signOut()}
            title={t("nav.signout")}
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed ? <span>{t("nav.signout")}</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}
function SectionLabel({ collapsed, children }) {
  if (collapsed) return <div className="mx-auto my-2.5 h-px w-8 bg-line" />;
  return (
    <div className="mt-4 mb-1.5 flex items-center px-2 text-[10px] font-extrabold tracking-[0.16em] text-faint uppercase first:mt-0">
      {children}
    </div>
  );
}
function NavButton({ item, active, collapsed, onClick, badge }) {
  const Icon = item.icon;
  const { t } = usePanel();
  return (
    <button
      type="button"
      className={cn("nav-item", active && "active", collapsed && "justify-center px-2.5")}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={collapsed ? t(item.labelKey) : undefined}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed ? <span className="flex-1 truncate">{t(item.labelKey)}</span> : null}
      {!collapsed && badge ? (
        <span className="rounded-full border border-ok/30 bg-ok/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ok">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
function Header() {
  const {
    profile,
    settings,
    view,
    setView,
    setMobileOpen,
    mode,
    toggleMode,
    draft,
    signOut,
    language,
    setLanguage,
    t,
  } = usePanel();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(event) {
      if (!ref.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <header className="glass sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 rounded-t-[var(--panel-radius)] border-x-0 border-t-0 px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-[10px] border border-line bg-sunken md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label={t("nav.openMenu")}
        >
          <Menu className="size-4" />
        </button>
        <h1 className="truncate text-[18px] font-extrabold tracking-tight">
          {t(`view.${view}`) || TITLES[view]}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <label className="relative hidden sm:block" title={t("nav.language")}>
          <Languages className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-steel" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t("nav.language")}
            className="h-10 appearance-none rounded-[10px] border border-line bg-sunken pr-7 pl-8 text-[12px] font-bold text-steel transition-colors hover:border-line-strong hover:text-ice"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-steel" />
        </label>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-[10px] border border-line bg-sunken text-steel transition-colors hover:border-line-strong hover:text-ice"
          onClick={toggleMode}
          aria-label={mode === "light" ? t("nav.darkMode") : t("nav.lightMode")}
          title={mode === "light" ? t("nav.darkMode") : t("nav.lightMode")}
        >
          {mode === "light" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>
        {settings.showHeaderUser ? (
          <div className="relative" ref={ref}>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-[12px] border border-line bg-sunken py-1.5 pr-2.5 pl-1.5"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <PresenceAvatar name={profile.username} src={profile.profilePic} size="sm" />
              <div className="hidden text-left sm:block">
                <div className="text-[13px] leading-tight font-extrabold text-ice">
                  {profile.username}
                </div>
                <div className="text-[10px] font-extrabold tracking-[0.12em] text-accent uppercase">
                  {profile.role}
                </div>
              </div>
              <ChevronDown
                className={cn("size-3.5 text-steel transition-transform", open && "rotate-180")}
              />
            </button>
            {open ? (
              <div className="glass glass-strong view-enter absolute top-[calc(100%+8px)] right-0 z-30 min-w-[200px] overflow-hidden p-1.5">
                <div className="px-3 py-2">
                  <div className="truncate text-[13px] font-extrabold">{profile.username}</div>
                  <div className="truncate text-[11.5px] font-semibold text-steel">
                    {profile.email}
                  </div>
                </div>
                <div className="my-1 h-px bg-line" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-bold hover:bg-fill-strong"
                  onClick={() => {
                    setView("account");
                    setOpen(false);
                  }}
                >
                  <UserRound className="size-3.5" />
                  My Profile
                </button>
                <div className="my-1 h-px bg-line" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-bold text-danger hover:bg-fill-strong"
                  onClick={() => void signOut()}
                >
                  <LogOut className="size-3.5" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
