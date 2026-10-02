/** Panel color-scheme: classic dark or light. */

/** How the wallpaper is mapped onto the screen: fill, fit whole, tile, or stretch. */

export const WALLPAPER_FITS = ["cover", "contain", "tile", "stretch"];
export function parseWallpaperFit(value) {
  return typeof value === "string" && WALLPAPER_FITS.includes(value) ? value : "cover";
}

/** Outbound mail server used to deliver password reset links. */

/** "Sign in with Google" — only active when `googleOauthEnabled` is true and
 *  both a client id and a client secret are configured. `googleAllowedEmail`
 *  is an optional whitelist that, when set, restricts the OAuth login to a
 *  single email address (typical for single-user panels). */

/** A plugin tracked by the panel for a Paper server; not a daemon install receipt. */

export const DEFAULT_THEME = {
  mode: "dark",
  wallpaperUrl: "shader:waves",
  bgBlur: 0,
  bgOpacity: 100,
  wallpaperFit: "cover",
  wallpaperZoom: 100,
  accentColor: "#d00000",
  glassTint: "#0c1424",
  navText: "#9da3b4",
  navTextActive: "#e7e9f0",
  glassBlur: 32,
  glassSaturate: 180,
  borderRadius: 18,
  glassOpacity: 90,
};
export const DEFAULT_GENERAL = {
  panelName: "BT Panel",
  defaultLanguage: "en",
  panelSubtitle: "Command center",
  welcomeTitle: "Welcome",
  welcomeMessage: "Manage your panel from one place.",
  faviconTitle: "BT Panel",
  panelLogo: "",
  faviconLogo: "",
};
export const DEFAULT_BARS = {
  showAdminStats: true,
  showVersion: true,
  showRole: true,
  showHeaderUser: true,
};
export const DEFAULT_ADVANCED = {
  requireTwoFactor: false,
  maintenanceMode: false,
  maintenanceMessage: "",
  maxServersPerUser: 10,
  defaultTemplate: "minecraft",
  backupRetention: 5,
  debugLogging: false,
};
export const DEFAULT_ACCESS = {
  allowRegistration: true,
  passwordResetEnabled: true,
  showTeam: true,
};
export const DEFAULT_SMTP = {
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPassConfigured: false,
  smtpPass: "",
  smtpFrom: "BT Panel <no-reply@btpanel.local>",
};
export const DEFAULT_GOOGLE_OAUTH = {
  googleOauthEnabled: false,
  googleClientId: "",
  googleClientSecretConfigured: false,
  googleClientSecret: "",
  googleAllowedEmail: "",
};
export const DEFAULT_SETTINGS = {
  ...DEFAULT_THEME,
  ...DEFAULT_GENERAL,
  ...DEFAULT_BARS,
  ...DEFAULT_ADVANCED,
  ...DEFAULT_ACCESS,
  ...DEFAULT_SMTP,
  ...DEFAULT_GOOGLE_OAUTH,
};
export const THEME_KEYS = Object.keys(DEFAULT_THEME);
export function pickTheme(settings) {
  const out = {};
  for (const key of THEME_KEYS) out[key] = settings[key];
  return out;
}
export const PANEL_VERSION = "v2.1.1";
export const REPO_URL = "https://github.com/BT-Studio-dev/BT-Panel";
export function isAdminRole(role) {
  return role === "owner" || role === "admin";
}
export const PANEL_VIEWS = [
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
  "updates",
];
/** Views only an owner or admin may open. */
const ADMIN_VIEWS = ["settings", "locations", "users", "apikeys", "nests", "mounts"];
export const SETTINGS_TABS = [
  "general",
  "appearance",
  "wallpapers",
  "bars",
  "mail",
  "advanced",
  "nodes",
  "access",
];

/** Validate a requested panel view; members asking for admin pages land on Home. */
export function resolveView(requested, role) {
  const view =
    typeof requested === "string" && PANEL_VIEWS.includes(requested) ? requested : "home";
  return ADMIN_VIEWS.includes(view) && !isAdminRole(role) ? "home" : view;
}

/** Validate a ?tab= value for the settings view. */
export function resolveSettingsTab(requested) {
  return typeof requested === "string" && SETTINGS_TABS.includes(requested) ? requested : "general";
}
