import type { LanguageId } from "./i18n";

export type PanelRole = "owner" | "admin" | "member";
export type PanelStatus = "active" | "suspended";
export type PanelView =
  | "home"
  | "servers"
  | "team"
  | "settings"
  | "users"
  | "account"
  | "nodes"
  | "locations"
  | "apikeys"
  | "nests"
  | "mounts";
export type SettingsTab = "general" | "appearance" | "wallpapers" | "bars" | "mail" | "advanced" | "access" | "nodes";

/** Panel color-scheme: classic dark or light. */
export type ThemeMode = "dark" | "light";

/** How the wallpaper is mapped onto the screen: fill, fit whole, tile, or stretch. */
export type WallpaperFit = "cover" | "contain" | "tile" | "stretch";

export const WALLPAPER_FITS: WallpaperFit[] = ["cover", "contain", "tile", "stretch"];

export function parseWallpaperFit(value: unknown): WallpaperFit {
  return typeof value === "string" && (WALLPAPER_FITS as string[]).includes(value) ? (value as WallpaperFit) : "cover";
}

export type ThemeSettings = {
  mode: ThemeMode;
  wallpaperUrl: string;
  bgBlur: number;
  bgOpacity: number;
  wallpaperFit: WallpaperFit;
  wallpaperZoom: number;
  accentColor: string;
  glassTint: string;
  navText: string;
  navTextActive: string;
  glassBlur: number;
  glassSaturate: number;
  borderRadius: number;
  glassOpacity: number;
};

export type GeneralSettings = {
  panelName: string;
  /** Fallback UI language; see lib/panel/i18n.ts. */
  defaultLanguage: LanguageId;
  panelSubtitle: string;
  welcomeTitle: string;
  welcomeMessage: string;
  faviconTitle: string;
  panelLogo: string;
  faviconLogo: string;
};

export type BarsSettings = {
  showAdminStats: boolean;
  showVersion: boolean;
  showRole: boolean;
  showHeaderUser: boolean;
};

export type AdvancedSettings = {
  /** When true, admins must have a verified TOTP secret before they can sign in. */
  requireTwoFactor: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maxServersPerUser: number;
  defaultTemplate: string;
  backupRetention: number;
  debugLogging: boolean;
};

export type AccessSettings = {
  allowRegistration: boolean;
  passwordResetEnabled: boolean;
  showTeam: boolean;
};

/** Outbound mail server used to deliver password reset links. */
export type SmtpSettings = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  /** Client-safe presence flag; the password itself is never returned to browsers. */
  smtpPassConfigured: boolean;
  smtpPass: string;
  smtpFrom: string;
};

/** "Sign in with Google" — only active when `googleOauthEnabled` is true and
 *  both a client id and a client secret are configured. `googleAllowedEmail`
 *  is an optional whitelist that, when set, restricts the OAuth login to a
 *  single email address (typical for single-user panels). */
export type GoogleOauthSettings = {
  googleOauthEnabled: boolean;
  googleClientId: string;
  /** Client-safe presence flag; the secret itself is never returned to browsers. */
  googleClientSecretConfigured: boolean;
  googleClientSecret: string;
  googleAllowedEmail: string;
};

export type PanelSettings = ThemeSettings &
  GeneralSettings &
  BarsSettings &
  AdvancedSettings &
  AccessSettings &
  SmtpSettings &
  GoogleOauthSettings;

export type PanelProfile = {
  userId: string;
  username: string;
  email: string;
  role: PanelRole;
  status: PanelStatus;
  bio: string;
  profilePic: string;
  lastSeen: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  online: boolean;
};

export type ServerStatus = "running" | "offline" | "starting" | "stopping";
export type PowerAction = "start" | "stop" | "restart" | "kill";

export type ServerDto = {
  id: string;
  name: string;
  template: string;
  status: ServerStatus;
  /** ISO time the server reached "running" (uptime origin) — null when not running. */
  startedAt: string | null;
  node: string;
  ip: string;
  port: number;
  cpuLimit: number;
  memoryMb: number;
  diskMb: number;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
};

export type ServerEventDto = {
  id: number;
  level: "info" | "warn" | "error" | "cmd" | "system";
  message: string;
  createdAt: string;
};

/** A plugin tracked by the panel for a Paper server; not a daemon install receipt. */
export type ServerPluginDto = {
  id: string;
  serverId: string;
  catalogId: string;
  name: string;
  version: string;
  createdAt: string;
};

export type BackupStatus = "creating" | "ready";

export type BackupDto = {
  id: string;
  serverId: string;
  name: string;
  sizeMb: number;
  status: BackupStatus;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type NodeDto = {
  id: string;
  name: string;
  region: string;
  subnet: string;
  serverCount: number;
};

export type NestDto = {
  id: string;
  name: string;
  description: string;
  /** A SERVER_TEMPLATES id — the service this nest offers. */
  egg: string;
};

export type MountDto = {
  id: string;
  name: string;
  description: string;
  /** Host path that gets mounted. */
  path: string;
  /** Where it is visible inside the server's filesystem. */
  target: string;
  readOnly: boolean;
  userMountable: boolean;
  fstype: string;
  sizeGb: number;
};

export type BootstrapPayload = {
  profile: PanelProfile;
  settings: PanelSettings;
  team: PanelProfile[];
  servers: ServerDto[];
  nodes: NodeDto[];
  userCount: number;
};

export const DEFAULT_THEME: ThemeSettings = {
  mode: "dark",
  wallpaperUrl: "shader:waves",
  bgBlur: 0,
  bgOpacity: 100,
  wallpaperFit: "cover",
  wallpaperZoom: 100,
  accentColor: "#3b82f6",
  glassTint: "#0c1424",
  navText: "#9da3b4",
  navTextActive: "#e7e9f0",
  glassBlur: 32,
  glassSaturate: 180,
  borderRadius: 18,
  glassOpacity: 90,
};

export const DEFAULT_GENERAL: GeneralSettings = {
  panelName: "BT Panel",
  defaultLanguage: "en",
  panelSubtitle: "Command center",
  welcomeTitle: "Welcome",
  welcomeMessage: "Manage your panel from one place.",
  faviconTitle: "BT Panel",
  panelLogo: "",
  faviconLogo: "",
};

export const DEFAULT_BARS: BarsSettings = {
  showAdminStats: true,
  showVersion: true,
  showRole: true,
  showHeaderUser: true,
};

export const DEFAULT_ADVANCED: AdvancedSettings = {
  requireTwoFactor: false,
  maintenanceMode: false,
  maintenanceMessage: "",
  maxServersPerUser: 10,
  defaultTemplate: "minecraft",
  backupRetention: 5,
  debugLogging: false,
};

export const DEFAULT_ACCESS: AccessSettings = {
  allowRegistration: true,
  passwordResetEnabled: true,
  showTeam: true,
};

export const DEFAULT_SMTP: SmtpSettings = {
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPassConfigured: false,
  smtpPass: "",
  smtpFrom: "BT Panel <no-reply@btpanel.local>",
};

export const DEFAULT_GOOGLE_OAUTH: GoogleOauthSettings = {
  googleOauthEnabled: false,
  googleClientId: "",
  googleClientSecretConfigured: false,
  googleClientSecret: "",
  googleAllowedEmail: "",
};

export const DEFAULT_SETTINGS: PanelSettings = {
  ...DEFAULT_THEME,
  ...DEFAULT_GENERAL,
  ...DEFAULT_BARS,
  ...DEFAULT_ADVANCED,
  ...DEFAULT_ACCESS,
  ...DEFAULT_SMTP,
  ...DEFAULT_GOOGLE_OAUTH,
};

export const THEME_KEYS = Object.keys(DEFAULT_THEME) as (keyof ThemeSettings)[];

export function pickTheme(settings: PanelSettings): ThemeSettings {
  const out = {} as Record<string, unknown>;
  for (const key of THEME_KEYS) out[key] = settings[key];
  return out as ThemeSettings;
}

export const PANEL_VERSION = "v2.1.1";
export const REPO_URL = "https://github.com/BT-Studio-dev/BT-Panel";

export function isAdminRole(role: PanelRole | string | undefined): boolean {
  return role === "owner" || role === "admin";
}

export const PANEL_VIEWS: PanelView[] = [
  "home",
  "servers",
  "team",
  "settings",
  "users",
  "account",
  "nodes",
  "locations",
  "apikeys",
  "nests",
  "mounts",
];
/** Views only an owner or admin may open. */
const ADMIN_VIEWS: PanelView[] = ["settings", "locations", "users", "apikeys", "nests", "mounts"];
export const SETTINGS_TABS: SettingsTab[] = ["general", "appearance", "wallpapers", "bars", "mail", "advanced", "nodes", "access"];

/** Validate a requested panel view; members asking for admin pages land on Home. */
export function resolveView(requested: unknown, role: PanelRole | string): PanelView {
  const view =
    typeof requested === "string" && (PANEL_VIEWS as string[]).includes(requested) ? (requested as PanelView) : "home";
  return ADMIN_VIEWS.includes(view) && !isAdminRole(role) ? "home" : view;
}

/** Validate a ?tab= value for the settings view. */
export function resolveSettingsTab(requested: unknown): SettingsTab {
  return typeof requested === "string" && (SETTINGS_TABS as string[]).includes(requested)
    ? (requested as SettingsTab)
    : "general";
}
