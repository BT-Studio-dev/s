import { cache } from "react";
import { and, desc, eq, gt, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { mediaFiles, mounts, nests, nodes, panelSettings, passwordResetTokens, schemaMigrations, serverBackups, serverEvents, serverPlugins, servers, sessions, users } from "@/db/schema";
import {
  CPU_OPTIONS,
  DISK_OPTIONS,
  MEMORY_OPTIONS,
  PAPER_PLUGINS,
  SERVER_TEMPLATES,
  consoleReply,
  getTemplate,
  parseShaderWallpaper,
} from "@/lib/panel/catalog";
import { parseMode } from "@/lib/panel/theme";
import { generateSecret, otpauthUrl, verifyCode } from "@/lib/server/totp";
import { parseLanguage } from "@/lib/panel/i18n";
import {
  DEFAULT_SETTINGS,
  isAdminRole,
  type BackupDto,
  type BackupStatus,
  type MountDto,
  type NestDto,
  parseWallpaperFit,
  type BootstrapPayload,
  type NodeDto,
  type PanelProfile,
  type PanelRole,
  type PanelSettings,
  type ServerDto,
  type ServerEventDto,
  type ServerPluginDto,
  type ServerStatus,
} from "@/lib/panel/types";
import { toHexColor } from "@/lib/utils";
import { HttpError, hashPassword, newId, newToken, sha256, verifyPassword } from "./core";

export type UserRow = typeof users.$inferSelect;
type ServerRow = typeof servers.$inferSelect;
type SettingsRow = typeof panelSettings.$inferSelect;
type SettingsInsert = typeof panelSettings.$inferInsert;
type EventLevel = ServerEventDto["level"];

// ── Versioned MySQL bootstrap ───────────────────────────────────────────────
const INITIAL_MIGRATION = "0001_mysql_initial";
const INITIAL_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    username VARCHAR(24) NOT NULL,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'member',
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    bio VARCHAR(280) NOT NULL DEFAULT '',
    profile_pic MEDIUMTEXT NOT NULL,
    totp_secret VARCHAR(64) NULL,
    totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen DATETIME(3) NULL,
    last_login_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT users_email_unique UNIQUE (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY sessions_user_idx (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS panel_settings (
    id INT NOT NULL PRIMARY KEY,
    theme_mode VARCHAR(16) NOT NULL DEFAULT 'dark',
    wallpaper_url VARCHAR(2048) NOT NULL DEFAULT 'shader:waves',
    bg_blur INT NOT NULL DEFAULT 0,
    bg_opacity INT NOT NULL DEFAULT 100,
    wallpaper_fit VARCHAR(16) NOT NULL DEFAULT 'cover',
    wallpaper_zoom INT NOT NULL DEFAULT 100,
    accent_color VARCHAR(16) NOT NULL DEFAULT '#3b82f6',
    glass_tint VARCHAR(16) NOT NULL DEFAULT '#0c1424',
    nav_text VARCHAR(16) NOT NULL DEFAULT '#9da3b4',
    nav_text_active VARCHAR(16) NOT NULL DEFAULT '#e7e9f0',
    glass_blur INT NOT NULL DEFAULT 20,
    glass_saturate INT NOT NULL DEFAULT 160,
    border_radius INT NOT NULL DEFAULT 16,
    glass_opacity INT NOT NULL DEFAULT 62,
    show_team BOOLEAN NOT NULL DEFAULT TRUE,
    panel_name VARCHAR(40) NOT NULL DEFAULT 'BT Panel',
    panel_subtitle VARCHAR(60) NOT NULL DEFAULT 'Command center',
    favicon_title VARCHAR(60) NOT NULL DEFAULT 'BT Panel',
    panel_logo MEDIUMTEXT NOT NULL,
    favicon_logo MEDIUMTEXT NOT NULL,
    welcome_title VARCHAR(80) NOT NULL DEFAULT 'Welcome',
    welcome_message VARCHAR(280) NOT NULL DEFAULT 'Manage your panel from one place.',
    show_admin_stats BOOLEAN NOT NULL DEFAULT TRUE,
    show_version BOOLEAN NOT NULL DEFAULT TRUE,
    show_role BOOLEAN NOT NULL DEFAULT TRUE,
    show_header_user BOOLEAN NOT NULL DEFAULT TRUE,
    allow_registration BOOLEAN NOT NULL DEFAULT TRUE,
    tutorials_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    password_reset_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_language VARCHAR(12) NOT NULL DEFAULT 'en',
    require_two_factor BOOLEAN NOT NULL DEFAULT FALSE,
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    maintenance_message VARCHAR(280) NOT NULL DEFAULT '',
    max_servers_per_user INT NOT NULL DEFAULT 10,
    default_template VARCHAR(40) NOT NULL DEFAULT 'minecraft',
    backup_retention INT NOT NULL DEFAULT 5,
    debug_logging BOOLEAN NOT NULL DEFAULT FALSE,
    smtp_host VARCHAR(200) NOT NULL DEFAULT '',
    smtp_port INT NOT NULL DEFAULT 587,
    smtp_secure BOOLEAN NOT NULL DEFAULT FALSE,
    smtp_user VARCHAR(200) NOT NULL DEFAULT '',
    smtp_pass VARCHAR(400) NOT NULL DEFAULT '',
    smtp_from VARCHAR(200) NOT NULL DEFAULT 'BT Panel <no-reply@btpanel.local>',
    google_oauth_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    google_client_id VARCHAR(240) NOT NULL DEFAULT '',
    google_client_secret VARCHAR(400) NOT NULL DEFAULT '',
    google_allowed_email VARCHAR(200) NOT NULL DEFAULT '',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS servers (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    template VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'offline',
    status_changed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    started_at DATETIME(3) NULL,
    node VARCHAR(64) NOT NULL,
    ip VARCHAR(64) NOT NULL,
    port INT NOT NULL,
    cpu_limit INT NOT NULL DEFAULT 200,
    memory_mb INT NOT NULL DEFAULT 4096,
    disk_mb INT NOT NULL DEFAULT 20480,
    owner_id VARCHAR(64) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT servers_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    KEY servers_owner_idx (owner_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS server_events (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    server_id VARCHAR(64) NOT NULL,
    level VARCHAR(16) NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT server_events_server_id_servers_id_fk FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    KEY server_events_server_idx (server_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS server_plugins (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    server_id VARCHAR(64) NOT NULL,
    catalog_id VARCHAR(64) NOT NULL,
    name VARCHAR(120) NOT NULL,
    version VARCHAR(60) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT server_plugins_server_id_servers_id_fk FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    CONSTRAINT server_plugins_server_catalog_unique UNIQUE (server_id, catalog_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS server_backups (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    server_id VARCHAR(64) NOT NULL,
    name VARCHAR(60) NOT NULL,
    size_mb INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'creating',
    created_by VARCHAR(64) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT server_backups_server_id_servers_id_fk FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    CONSTRAINT server_backups_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    KEY server_backups_server_idx (server_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS nodes (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    region VARCHAR(12) NOT NULL DEFAULT 'EU',
    subnet VARCHAR(24) NOT NULL DEFAULT '10.0.0.',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS media_files (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    mime VARCHAR(80) NOT NULL,
    data LONGTEXT NOT NULL,
    created_by VARCHAR(64) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS nests (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    description VARCHAR(200) NOT NULL DEFAULT '',
    egg VARCHAR(40) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS mounts (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(191) NOT NULL DEFAULT '',
    path VARCHAR(120) NOT NULL,
    target VARCHAR(120) NOT NULL DEFAULT '/mnt',
    read_only BOOLEAN NOT NULL DEFAULT FALSE,
    user_mountable BOOLEAN NOT NULL DEFAULT FALSE,
    fstype VARCHAR(16) NOT NULL DEFAULT 'overlay',
    size_gb INT NOT NULL DEFAULT 100,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY mounts_name_unique (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    used_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY password_reset_tokens_user_idx (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
] as const;

const globalForSetup = globalThis as typeof globalThis & { __btpReady?: Promise<void> };

export function ensureDatabase(): Promise<void> {
  if (!globalForSetup.__btpReady) {
    globalForSetup.__btpReady = (async () => {
      await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(80) NOT NULL PRIMARY KEY,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`));
      const applied = await db.select({ id: schemaMigrations.id }).from(schemaMigrations).where(eq(schemaMigrations.id, INITIAL_MIGRATION)).limit(1);
      if (applied.length) return;
      for (const statement of INITIAL_SCHEMA) await db.execute(sql.raw(statement));
      // This is the only initial row. It holds panel defaults, not a user, node, or server fixture.
      await db.execute(sql.raw(`INSERT INTO panel_settings (id, panel_logo, favicon_logo) VALUES (1, '', '') ON DUPLICATE KEY UPDATE id = id`));
      await db.execute(sql`INSERT INTO schema_migrations (id) VALUES (${INITIAL_MIGRATION}) ON DUPLICATE KEY UPDATE id = id`);
    })().catch((err) => {
      globalForSetup.__btpReady = undefined;
      throw err;
    });
  }
  return globalForSetup.__btpReady;
}

// ── Daemon simulation constants ─────────────────────────────────────────────
const BOOT_MS = 4200;
const STOP_MS = 2600;
const RESTART_GAP_MS = 1800;
const BACKUP_MS = 5000;
const MAX_BACKUPS_PER_SERVER = 5;
const SYSTEM = "container@bt-panel~";
const LINES = {
  running: `${SYSTEM} Server marked as running...`,
  stopping: `${SYSTEM} Server marked as stopping...`,
  offline: `${SYSTEM} Server marked as offline...`,
  killed: `${SYSTEM} Server process killed (SIGKILL)`,
};

function levelOf(message: string): EventLevel {
  return message.startsWith(SYSTEM) ? "system" : "info";
}

// ── Settings ────────────────────────────────────────────────────────────────
function rowToSettings(row: SettingsRow): PanelSettings {
  return {
    mode: parseMode(row.themeMode) ?? "dark",
    wallpaperUrl: row.wallpaperUrl,
    bgBlur: row.bgBlur,
    bgOpacity: row.bgOpacity,
    wallpaperFit: parseWallpaperFit(row.wallpaperFit),
    wallpaperZoom: row.wallpaperZoom,
    accentColor: row.accentColor,
    glassTint: row.glassTint,
    navText: row.navText,
    navTextActive: row.navTextActive,
    glassBlur: row.glassBlur,
    glassSaturate: row.glassSaturate,
    borderRadius: row.borderRadius,
    glassOpacity: row.glassOpacity,
    showTeam: row.showTeam,
    panelName: row.panelName,
    panelSubtitle: row.panelSubtitle,
    welcomeTitle: row.welcomeTitle,
    welcomeMessage: row.welcomeMessage,
    faviconTitle: row.faviconTitle,
    panelLogo: row.panelLogo,
    faviconLogo: row.faviconLogo,
    showAdminStats: row.showAdminStats,
    showVersion: row.showVersion,
    showRole: row.showRole,
    showHeaderUser: row.showHeaderUser,
    allowRegistration: row.allowRegistration,
    passwordResetEnabled: row.passwordResetEnabled,
    defaultLanguage: parseLanguage(row.defaultLanguage),
    requireTwoFactor: row.requireTwoFactor,
    maintenanceMode: row.maintenanceMode,
    maintenanceMessage: row.maintenanceMessage,
    maxServersPerUser: row.maxServersPerUser,
    defaultTemplate: row.defaultTemplate,
    backupRetention: row.backupRetention,
    debugLogging: row.debugLogging,
    smtpHost: row.smtpHost,
    smtpPort: row.smtpPort,
    smtpSecure: row.smtpSecure,
    smtpUser: row.smtpUser,
    smtpPassConfigured: Boolean(row.smtpPass),
    smtpPass: row.smtpPass,
    smtpFrom: row.smtpFrom,
    googleOauthEnabled: row.googleOauthEnabled,
    googleClientId: row.googleClientId,
    googleClientSecretConfigured: Boolean(row.googleClientSecret),
    googleClientSecret: row.googleClientSecret,
    googleAllowedEmail: row.googleAllowedEmail,
  };
}

/** Browser-safe settings representation; secret values remain server-side. */
export function publicSettings(settings: PanelSettings): PanelSettings {
  return {
    ...settings,
    smtpPass: "",
    smtpPassConfigured: Boolean(settings.smtpPass || settings.smtpPassConfigured),
    googleClientSecret: "",
    googleClientSecretConfigured: Boolean(settings.googleClientSecret || settings.googleClientSecretConfigured),
  };
}

export const getSettings = cache(async (): Promise<PanelSettings> => {
  await ensureDatabase();
  const rows = await db.select().from(panelSettings).where(eq(panelSettings.id, 1)).limit(1);
  return rows[0] ? rowToSettings(rows[0]) : DEFAULT_SETTINGS;
});

/**
 * Public/read-only settings accessor.
 *
 * The panel shell and metadata must remain renderable when MySQL is
 * temporarily unavailable (for example during first boot or a preview).
 * Mutating/authenticated operations still use the strict database-backed
 * functions above.
 */
export async function getSettingsSafe(): Promise<PanelSettings> {
  try {
    return await getSettings();
  } catch (err) {
    console.warn("[bt-panel] MySQL unavailable; using default panel settings", err);
    return DEFAULT_SETTINGS;
  }
}

// ── Nodes ────────────────────────────────────────────────────────────────────
type NodeRow = typeof nodes.$inferSelect;

export const listNodes = cache(async (): Promise<NodeDto[]> => {
  await ensureDatabase();
  const rows = await db.select().from(nodes).orderBy(nodes.createdAt);
  const counts = await db
    .select({ node: servers.node, n: sql<number>`count(*)` })
    .from(servers)
    .groupBy(servers.node);
  const byNode = new Map(counts.map((row) => [row.node, Number(row.n)]));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    region: row.region,
    subnet: row.subnet,
    serverCount: byNode.get(row.id) ?? 0,
  }));
});

export async function createNode(input: { id?: unknown; name?: unknown; region?: unknown; subnet?: unknown }): Promise<NodeDto> {
  await ensureDatabase();
  const name = str(input.name, 40);
  if (!name) throw new HttpError(400, "Give the node a name.");
  const region = (str(input.region, 12) || "EU").toUpperCase();
  // Ids are stable handles referenced by servers, so keep them URL-safe.
  const base =
    str(input.id, 40)?.toLowerCase().replace(/[^a-z0-9-]/g, "-") ||
    `${region.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "node"}`;
  const clash = await db.select({ id: nodes.id }).from(nodes).where(eq(nodes.id, base)).limit(1);
  const id = clash.length ? `${base}-${newId("n").slice(2, 6)}` : base;
  const subnet = str(input.subnet, 24) || "10.0.0.";
  const row: NodeRow = {
    id,
    name,
    region,
    subnet: subnet.endsWith(".") ? subnet : `${subnet}.`,
    createdAt: new Date(),
  };
  await db.insert(nodes).values(row);
  return { id: row.id, name: row.name, region: row.region, subnet: row.subnet, serverCount: 0 };
}

export async function deleteNode(id: string): Promise<void> {
  await ensureDatabase();
  const target = String(id ?? "").trim();
  if (!target) throw new HttpError(400, "Missing node id.");
  // Refuse while servers still live here: dropping the node would leave those
  // rows pointing at a node that no longer exists.
  const placed = await db.select({ id: servers.id }).from(servers).where(eq(servers.node, target)).limit(1);
  if (placed.length) throw new HttpError(409, "Move or delete the servers on this node first.");
  const existing = await db.select({ id: nodes.id }).from(nodes).where(eq(nodes.id, target)).limit(1);
  if (!existing.length) throw new HttpError(404, "That node no longer exists.");
  await db.delete(nodes).where(eq(nodes.id, target));
}

const intIn = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(Math.min(max, Math.max(min, v))) : undefined;
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const color = (v: unknown) =>
  typeof v === "string" && /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v.trim()) ? toHexColor(v, "#000000") : undefined;

function imageRef(v: unknown, maxLength: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (s === "") return "";
  if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(s)) {
    if (s.length > maxLength) throw new HttpError(413, "That logo is too large — try a smaller image.");
    return s;
  }
  if (/^https?:\/\//i.test(s) || s.startsWith("/")) return s.slice(0, 2048);
  throw new HttpError(400, "Logos must be an uploaded image, an http(s) URL or a /path.");
}

function wallpaperRef(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (s === "" || parseShaderWallpaper(s)) return s;
  if (/^https?:\/\//i.test(s) || s.startsWith("/")) return s.slice(0, 2048);
  throw new HttpError(400, "Wallpaper must be a live shader, an http(s) URL or an uploaded file.");
}

export async function updateSettings(input: Record<string, unknown>): Promise<PanelSettings> {
  const patch: Partial<SettingsInsert> = {};
  const put = <K extends keyof SettingsInsert>(key: K, value: SettingsInsert[K] | undefined) => {
    if (value !== undefined) patch[key] = value;
  };
  put("themeMode", parseMode(input.mode) ?? undefined);
  put("wallpaperUrl", wallpaperRef(input.wallpaperUrl));
  put("bgBlur", intIn(input.bgBlur, 0, 100));
  put("bgOpacity", intIn(input.bgOpacity, 0, 100));
  put("wallpaperFit", typeof input.wallpaperFit === "string" ? parseWallpaperFit(input.wallpaperFit) : undefined);
  put("wallpaperZoom", intIn(input.wallpaperZoom, 100, 300));
  put("accentColor", color(input.accentColor));
  put("glassTint", color(input.glassTint));
  put("navText", color(input.navText));
  put("navTextActive", color(input.navTextActive));
  put("glassBlur", intIn(input.glassBlur, 0, 40));
  put("glassSaturate", intIn(input.glassSaturate, 100, 250));
  put("borderRadius", intIn(input.borderRadius, 0, 24));
  put("glassOpacity", intIn(input.glassOpacity, 0, 100));
  put("showTeam", bool(input.showTeam));
  const panelName = str(input.panelName, 40);
  if (panelName !== undefined && !panelName) throw new HttpError(400, "Panel name cannot be empty.");
  put("panelName", panelName);
  put("panelSubtitle", str(input.panelSubtitle, 60));
  put("faviconTitle", str(input.faviconTitle, 60));
  put("welcomeTitle", str(input.welcomeTitle, 80));
  put("welcomeMessage", str(input.welcomeMessage, 280));
  put("panelLogo", imageRef(input.panelLogo, 300_000));
  put("faviconLogo", imageRef(input.faviconLogo, 150_000));
  put("showAdminStats", bool(input.showAdminStats));
  put("showVersion", bool(input.showVersion));
  put("showRole", bool(input.showRole));
  put("showHeaderUser", bool(input.showHeaderUser));
  put("allowRegistration", bool(input.allowRegistration));
  put("passwordResetEnabled", bool(input.passwordResetEnabled));
  put("defaultLanguage", typeof input.defaultLanguage === "string" ? parseLanguage(input.defaultLanguage) : undefined);
  put("requireTwoFactor", bool(input.requireTwoFactor));
  put("maintenanceMode", bool(input.maintenanceMode));
  put("maintenanceMessage", str(input.maintenanceMessage, 280));
  put("maxServersPerUser", intIn(input.maxServersPerUser, 1, 100));
  put("defaultTemplate", typeof input.defaultTemplate === "string" && SERVER_TEMPLATES.some((t) => t.id === input.defaultTemplate) ? (input.defaultTemplate as string) : undefined);
  put("backupRetention", intIn(input.backupRetention, 1, 100));
  put("debugLogging", bool(input.debugLogging));
  put("smtpHost", str(input.smtpHost, 200));
  const port = intIn(input.smtpPort, 1, 65535);
  put("smtpPort", port);
  put("smtpSecure", bool(input.smtpSecure));
  put("smtpUser", str(input.smtpUser, 200));
  put("smtpPass", typeof input.smtpPass === "string" ? input.smtpPass.slice(0, 400) : undefined);
  const smtpFrom = str(input.smtpFrom, 200);
  put("smtpFrom", smtpFrom);
  put("googleOauthEnabled", bool(input.googleOauthEnabled));
  put("googleClientId", str(input.googleClientId, 240));
  put("googleClientSecret", typeof input.googleClientSecret === "string" ? input.googleClientSecret.slice(0, 400) : undefined);
  put("googleAllowedEmail", str(input.googleAllowedEmail, 200));
  if (Object.keys(patch).length === 0) throw new HttpError(400, "Nothing to update.");
  await db.update(panelSettings).set({ ...patch, updatedAt: new Date() }).where(eq(panelSettings.id, 1));
  const rows = await db.select().from(panelSettings).where(eq(panelSettings.id, 1)).limit(1);
  if (!rows[0]) throw new HttpError(500, "Panel settings are not initialized.");
  return rowToSettings(rows[0]);
}

// ── Profiles & users ────────────────────────────────────────────────────────
const ONLINE_MS = 2 * 60 * 1000;
const ROLE_RANK: Record<string, number> = { owner: 0, admin: 1, member: 2 };
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function toProfile(row: UserRow, includeEmail = true): PanelProfile {
  const role: PanelRole = row.role === "owner" || row.role === "admin" ? row.role : "member";
  return {
    userId: row.id,
    username: row.username,
    email: includeEmail ? row.email : "",
    role,
    status: row.status === "suspended" ? "suspended" : "active",
    bio: row.bio,
    profilePic: row.profilePic,
    lastSeen: row.lastSeen ? row.lastSeen.toISOString() : null,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    online: row.lastSeen ? Date.now() - row.lastSeen.getTime() < ONLINE_MS : false,
  };
}

export async function listTeam(includeEmail: boolean): Promise<PanelProfile[]> {
  const rows = await db.select().from(users).orderBy(users.createdAt);
  return rows
    .sort((a, b) => (ROLE_RANK[a.role] ?? 3) - (ROLE_RANK[b.role] ?? 3) || a.createdAt.getTime() - b.createdAt.getTime())
    .map((row) => toProfile(row, includeEmail));
}

export async function touchPresence(userId: string) {
  await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, userId));
}

export async function countUsers(): Promise<number> {
  await ensureDatabase();
  const rows = await db.select({ n: sql<number>`count(*)` }).from(users);
  return Number(rows[0]?.n ?? 0);
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findUserByIdentifier(identifier: string): Promise<UserRow | null> {
  const id = identifier.trim().toLowerCase();
  if (!id) return null;
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = ${id} or lower(${users.email}) = ${id}`)
    .limit(1);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

async function assertAvailable(username: string, email: string | null, exceptId?: string) {
  const rows = await db
    .select({ id: users.id, username: users.username, email: users.email })
    .from(users)
    .where(
      email
        ? sql`lower(${users.username}) = ${username.toLowerCase()} or lower(${users.email}) = ${email}`
        : sql`lower(${users.username}) = ${username.toLowerCase()}`,
    );
  const clash = rows.find((r) => r.id !== exceptId);
  if (clash) {
    throw new HttpError(409, email && clash.email.toLowerCase() === email ? "That email is already registered." : "That username is taken.");
  }
}

export async function createUser(input: { username: unknown; email: unknown; password: unknown; role: PanelRole; bio?: unknown }): Promise<UserRow> {
  await ensureDatabase();
  const username = typeof input.username === "string" ? input.username.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!USERNAME_RE.test(username)) throw new HttpError(400, "Username must be 3–24 characters: letters, numbers, dot, dash or underscore.");
  if (!EMAIL_RE.test(email) || email.length > 120) throw new HttpError(400, "Enter a valid email address.");
  if (password.length < 8 || password.length > 128) throw new HttpError(400, "Password must be at least 8 characters.");
  await assertAvailable(username, email);
  const id = newId("usr");
  const passwordHash = await hashPassword(password);
  const bio = typeof input.bio === "string" ? input.bio.slice(0, 280) : "";
  try {
    return await db.transaction(async (tx) => {
      // Serialize first-account registration through the singleton settings row.
      await tx.execute(sql`SELECT id FROM panel_settings WHERE id = 1 FOR UPDATE`);
      const counts = await tx.select({ n: sql<number>`count(*)` }).from(users);
      const role = input.role === "owner" ? (Number(counts[0]?.n ?? 0) === 0 ? "owner" : "member") : input.role;
      await tx.insert(users).values({ id, username, email, passwordHash, role, bio, profilePic: "" });
      const rows = await tx.select().from(users).where(eq(users.id, id)).limit(1);
      if (!rows[0]) throw new HttpError(500, "The new account could not be loaded.");
      return rows[0];
    });
  } catch (err) {
    if ((err as { code?: string })?.code === "ER_DUP_ENTRY") throw new HttpError(409, "That username or email is already registered.");
    throw err;
  }
}

function assertCanModify(actor: UserRow, target: UserRow | null): asserts target is UserRow {
  if (!target) throw new HttpError(404, "User not found.");
  if (target.role === "owner") throw new HttpError(403, "The owner account cannot be modified.");
  if (target.id === actor.id) throw new HttpError(403, "Use My Account to manage your own profile.");
  if (target.role === "admin" && actor.role !== "owner") throw new HttpError(403, "Only the owner can manage administrators.");
}

export async function adminUpdateUser(actor: UserRow, targetId: string, input: { role?: unknown; status?: unknown }) {
  const target = await getUserById(targetId);
  assertCanModify(actor, target);
  if (input.role !== undefined) {
    if (actor.role !== "owner") throw new HttpError(403, "Only the owner can change roles.");
    if (input.role !== "admin" && input.role !== "member") throw new HttpError(400, "Invalid role.");
    await db.update(users).set({ role: input.role }).where(eq(users.id, target.id));
  }
  if (input.status !== undefined) {
    if (input.status !== "active" && input.status !== "suspended") throw new HttpError(400, "Invalid status.");
    await db.update(users).set({ status: input.status }).where(eq(users.id, target.id));
    if (input.status === "suspended") await db.delete(sessions).where(eq(sessions.userId, target.id));
  }
}

export async function adminDeleteUser(actor: UserRow, targetId: string) {
  const target = await getUserById(targetId);
  assertCanModify(actor, target);
  await db.delete(users).where(eq(users.id, target.id));
}

export async function updateOwnProfile(user: UserRow, input: Record<string, unknown>): Promise<UserRow> {
  const patch: Partial<typeof users.$inferInsert> = {};
  if (input.username !== undefined) {
    const username = typeof input.username === "string" ? input.username.trim() : "";
    if (!USERNAME_RE.test(username)) throw new HttpError(400, "Username must be 3–24 characters: letters, numbers, dot, dash or underscore.");
    if (username.toLowerCase() !== user.username.toLowerCase()) await assertAvailable(username, null, user.id);
    patch.username = username;
  }
  if (input.bio !== undefined) patch.bio = typeof input.bio === "string" ? input.bio.trim().slice(0, 280) : "";
  if (input.profilePic !== undefined) {
    const pic = typeof input.profilePic === "string" ? input.profilePic.trim() : "";
    if (pic && !/^data:image\/(png|jpe?g|webp);base64,/i.test(pic)) throw new HttpError(400, "Profile picture must be a PNG, JPEG or WebP image.");
    if (pic.length > 200_000) throw new HttpError(413, "Profile picture is too large.");
    patch.profilePic = pic;
  }
  if (Object.keys(patch).length === 0) throw new HttpError(400, "Nothing to update.");
  await db.update(users).set(patch).where(eq(users.id, user.id));
  const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!rows[0]) throw new HttpError(404, "User not found.");
  return rows[0];
}

export async function changeOwnPassword(user: UserRow, current: unknown, next: unknown) {
  if (typeof current !== "string" || !(await verifyPassword(current, user.passwordHash))) {
    throw new HttpError(400, "Current password is incorrect.");
  }
  if (typeof next !== "string" || next.length < 8 || next.length > 128) {
    throw new HttpError(400, "New password must be at least 8 characters.");
  }
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id));
}

export async function markLogin(userId: string) {
  const now = new Date();
  await db.update(users).set({ lastLoginAt: now, lastSeen: now }).where(eq(users.id, userId));
}

// ── Servers ─────────────────────────────────────────────────────────────────
function effectiveStatus(row: ServerRow, now = Date.now()): ServerStatus {
  const elapsed = now - row.statusChangedAt.getTime();
  if (row.status === "starting") {
    if (elapsed < 0) return "stopping"; // restart: shutdown phase
    return elapsed >= BOOT_MS ? "running" : "starting";
  }
  if (row.status === "stopping") return elapsed >= STOP_MS ? "offline" : "stopping";
  return row.status === "running" ? "running" : "offline";
}

function toServerDto(row: ServerRow, ownerName: string | null): ServerDto {
  const now = Date.now();
  const status = effectiveStatus(row, now);
  return {
    id: row.id,
    name: row.name,
    template: row.template,
    status,
    startedAt:
      status === "running" && row.startedAt ? new Date(Math.min(row.startedAt.getTime(), now)).toISOString() : null,
    node: row.node,
    ip: row.ip,
    port: row.port,
    cpuLimit: row.cpuLimit,
    memoryMb: row.memoryMb,
    diskMb: row.diskMb,
    ownerId: row.ownerId,
    ownerName,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listServers(viewer: UserRow): Promise<ServerDto[]> {
  const rows = await db
    .select({ server: servers, ownerName: users.username })
    .from(servers)
    .leftJoin(users, eq(servers.ownerId, users.id))
    .where(isAdminRole(viewer.role) ? undefined : eq(servers.ownerId, viewer.id))
    .orderBy(servers.createdAt);
  return rows.map((r) => toServerDto(r.server, r.ownerName));
}

/** Transfer a server to an active user (or leave it unassigned), recording the
 * change alongside the server's event history in the same transaction. */
export async function transferServerOwner(actor: UserRow, serverId: string, requestedOwnerId: unknown): Promise<ServerDto> {
  if (!isAdminRole(actor.role)) throw new HttpError(403, "Administrator permission required.");
  if (requestedOwnerId !== null && typeof requestedOwnerId !== "string") {
    throw new HttpError(400, "Choose a valid server owner.");
  }
  const ownerId = typeof requestedOwnerId === "string" ? requestedOwnerId.trim() || null : null;
  await ensureDatabase();
  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ server: servers, ownerName: users.username })
      .from(servers)
      .leftJoin(users, eq(servers.ownerId, users.id))
      .where(eq(servers.id, serverId))
      .limit(1);
    const current = existing[0];
    if (!current) throw new HttpError(404, "Server not found.");

    let nextOwner: UserRow | null = null;
    if (ownerId) {
      const matches = await tx.select().from(users).where(eq(users.id, ownerId)).limit(1);
      nextOwner = matches[0] ?? null;
      if (!nextOwner) throw new HttpError(404, "New owner not found.");
      if (nextOwner.status !== "active") throw new HttpError(409, "A suspended user cannot own a server.");
    }

    if (current.server.ownerId === ownerId) return { row: current.server, ownerName: current.ownerName };
    await tx.update(servers).set({ ownerId }).where(eq(servers.id, serverId));
    const updated = await tx.select().from(servers).where(eq(servers.id, serverId)).limit(1);
    if (!updated[0]) throw new HttpError(404, "Server not found.");
    await tx.insert(serverEvents).values({
      serverId,
      level: "system",
      message: `${SYSTEM} Ownership transferred from ${current.ownerName ?? "Unassigned"} to ${nextOwner?.username ?? "Unassigned"} by ${actor.username}`,
      createdAt: new Date(),
    });
    return { row: updated[0], ownerName: nextOwner?.username ?? null };
  });
  return toServerDto(result.row, result.ownerName);
}

export async function getManagedServer(viewer: UserRow, id: string) {
  const rows = await db
    .select({ server: servers, ownerName: users.username })
    .from(servers)
    .leftJoin(users, eq(servers.ownerId, users.id))
    .where(eq(servers.id, id))
    .limit(1);
  const row = rows[0];
  if (!row || (!isAdminRole(viewer.role) && row.server.ownerId !== viewer.id)) {
    throw new HttpError(404, "Server not found.");
  }
  return { row: row.server, ownerName: row.ownerName };
}

export async function getServerWithEvents(viewer: UserRow, id: string) {
  const { row, ownerName } = await getManagedServer(viewer, id);
  return { server: toServerDto(row, ownerName), events: await listServerEvents(id) };
}

export async function createServer(viewer: UserRow, input: Record<string, unknown>): Promise<ServerDto> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 2 || name.length > 40) throw new HttpError(400, "Server name must be 2–40 characters.");
  const template = SERVER_TEMPLATES.find((t) => t.id === input.template);
  if (!template) throw new HttpError(400, "Pick a server template.");
  // Validate against the live node table, not the sample constant: a node the
  // admin has deleted must not silently accept a server, and a panel with no
  // nodes at all must say so rather than place the server on a phantom host.
  const available = await listNodes();
  if (!available.length) throw new HttpError(409, "Add a node in Settings → Nodes before creating a server.");
  const node = available.find((n) => n.id === input.node) ?? available[0];
  const memoryMb = MEMORY_OPTIONS.includes(Number(input.memoryMb)) ? Number(input.memoryMb) : 4096;
  const cpuLimit = CPU_OPTIONS.includes(Number(input.cpuLimit)) ? Number(input.cpuLimit) : 200;
  const diskMb = DISK_OPTIONS.includes(Number(input.diskMb)) ? Number(input.diskMb) : 20480;
  if (!isAdminRole(viewer.role)) {
    const own = await db.select({ id: servers.id }).from(servers).where(eq(servers.ownerId, viewer.id));
    if (own.length >= 3) throw new HttpError(403, "Members can own up to 3 servers — ask an admin for more.");
  }
  const onNode = await db.select({ port: servers.port }).from(servers).where(eq(servers.node, node.id));
  const used = new Set(onNode.map((s) => s.port));
  let port = template.defaultPort;
  while (used.has(port)) port += 1;
  const ip = `${node.subnet}${10 + ((onNode.length + 1) % 240)}`;
  const id = newId("srv");
  const now = Date.now();
  const created: ServerRow = {
    id,
    name,
    template: template.id,
    status: "offline",
    statusChangedAt: new Date(now),
    startedAt: null,
    node: node.id,
    ip,
    port,
    cpuLimit,
    memoryMb,
    diskMb,
    ownerId: viewer.id,
    createdAt: new Date(now),
  };
  await db.insert(servers).values(created);
  await db.insert(serverEvents).values([
    { serverId: id, level: "system", message: `${SYSTEM} Pulling image ${template.image}`, createdAt: new Date(now) },
    { serverId: id, level: "system", message: `${SYSTEM} Installation completed — press Start to boot ${name}`, createdAt: new Date(now + 5) },
  ]);
  return toServerDto(created, viewer.username);
}

function toServerPluginDto(row: typeof serverPlugins.$inferSelect): ServerPluginDto {
  return {
    id: row.id,
    serverId: row.serverId,
    catalogId: row.catalogId,
    name: row.name,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
  };
}

async function assertPaperServer(viewer: UserRow, serverId: string) {
  const { row } = await getManagedServer(viewer, serverId);
  if (row.template !== "minecraft") throw new HttpError(409, "Plugin tracking is only available for Paper servers.");
}

export async function listServerPlugins(viewer: UserRow, serverId: string): Promise<ServerPluginDto[]> {
  await ensureDatabase();
  await assertPaperServer(viewer, serverId);
  const rows = await db.select().from(serverPlugins).where(eq(serverPlugins.serverId, serverId)).orderBy(serverPlugins.name);
  return rows.map(toServerPluginDto);
}

export async function addServerPlugin(viewer: UserRow, serverId: string, catalogId: unknown): Promise<ServerPluginDto> {
  await ensureDatabase();
  await assertPaperServer(viewer, serverId);
  if (typeof catalogId !== "string") throw new HttpError(400, "Choose a plugin from the catalog.");
  const item = PAPER_PLUGINS.find((plugin) => plugin.id === catalogId);
  if (!item) throw new HttpError(400, "That plugin is not in the supported catalog.");
  const id = newId("plg");
  const createdAt = new Date();
  try {
    await db.insert(serverPlugins).values({ id, serverId, catalogId: item.id, name: item.name, version: item.version, createdAt });
  } catch (err) {
    if ((err as { code?: string })?.code === "ER_DUP_ENTRY") throw new HttpError(409, "This plugin is already on the Paper server list.");
    throw err;
  }
  return toServerPluginDto({ id, serverId, catalogId: item.id, name: item.name, version: item.version, createdAt });
}

export async function removeServerPlugin(viewer: UserRow, serverId: string, pluginId: string): Promise<void> {
  await ensureDatabase();
  await assertPaperServer(viewer, serverId);
  const existing = await db
    .select({ id: serverPlugins.id })
    .from(serverPlugins)
    .where(and(eq(serverPlugins.serverId, serverId), eq(serverPlugins.id, pluginId)))
    .limit(1);
  if (!existing.length) throw new HttpError(404, "Plugin entry not found.");
  await db.delete(serverPlugins).where(and(eq(serverPlugins.serverId, serverId), eq(serverPlugins.id, pluginId)));
}

async function schedule(
  serverId: string,
  lines: { level?: EventLevel; message: string }[],
  startOffset: number,
  span: number,
  base: number,
) {
  if (!lines.length) return;
  const step = lines.length > 1 ? span / (lines.length - 1) : 0;
  await db.insert(serverEvents).values(
    lines.map((l, i) => ({
      serverId,
      level: l.level ?? levelOf(l.message),
      message: l.message,
      createdAt: new Date(base + startOffset + Math.round(i * step)),
    })),
  );
}

async function trimEvents(serverId: string) {
  const expired = await db
    .select({ id: serverEvents.id })
    .from(serverEvents)
    .where(eq(serverEvents.serverId, serverId))
    .orderBy(desc(serverEvents.id))
    .offset(300);
  if (expired.length) await db.delete(serverEvents).where(inArray(serverEvents.id, expired.map((row) => row.id)));
}

const asLines = (messages: string[]) => messages.map((message) => ({ message }));

export async function powerServer(viewer: UserRow, id: string, action: unknown): Promise<ServerDto> {
  const { row, ownerName } = await getManagedServer(viewer, id);
  const status = effectiveStatus(row);
  const now = Date.now();
  const t = getTemplate(row.template);
  const clearFuture = () =>
    db.delete(serverEvents).where(and(eq(serverEvents.serverId, id), gt(serverEvents.createdAt, new Date(now))));
  let patch: Partial<typeof servers.$inferInsert>;
  switch (action) {
    case "start":
      if (status !== "offline") throw new HttpError(409, "Server is already running.");
      await clearFuture();
      patch = { status: "starting", statusChangedAt: new Date(now), startedAt: new Date(now + BOOT_MS) };
      await schedule(id, [...asLines(t.bootLog), { message: LINES.running }], 0, BOOT_MS, now);
      break;
    case "stop":
      if (status !== "running" && status !== "starting") throw new HttpError(409, "Server is not running.");
      await clearFuture();
      patch = { status: "stopping", statusChangedAt: new Date(now), startedAt: null };
      await schedule(id, [{ message: LINES.stopping }, ...asLines(t.stopLog), { message: LINES.offline }], 0, STOP_MS, now);
      break;
    case "restart":
      if (status !== "running") throw new HttpError(409, "Only a running server can be restarted.");
      await clearFuture();
      patch = {
        status: "starting",
        statusChangedAt: new Date(now + RESTART_GAP_MS),
        startedAt: new Date(now + RESTART_GAP_MS + BOOT_MS),
      };
      await schedule(id, [{ message: LINES.stopping }, ...asLines(t.stopLog)], 0, RESTART_GAP_MS - 300, now);
      await schedule(id, [...asLines(t.bootLog), { message: LINES.running }], RESTART_GAP_MS, BOOT_MS, now);
      break;
    case "kill":
      if (status === "offline") throw new HttpError(409, "Server is already offline.");
      await clearFuture();
      patch = { status: "offline", statusChangedAt: new Date(now), startedAt: null };
      await schedule(id, [{ level: "error", message: LINES.killed }], 0, 0, now);
      break;
    default:
      throw new HttpError(400, "Unknown power action.");
  }
  await db.update(servers).set(patch).where(eq(servers.id, id));
  const updated = await db.select().from(servers).where(eq(servers.id, id)).limit(1);
  if (!updated[0]) throw new HttpError(404, "Server not found.");
  await trimEvents(id);
  return toServerDto(updated[0], ownerName);
}

export async function sendServerCommand(viewer: UserRow, id: string, command: unknown) {
  const { row } = await getManagedServer(viewer, id);
  const text = typeof command === "string" ? command.trim().slice(0, 200) : "";
  if (!text) throw new HttpError(400, "Type a command first.");
  if (effectiveStatus(row) !== "running") throw new HttpError(409, "Server is not running — start it to use the console.");
  const now = Date.now();
  if (text.toLowerCase() === "clear") {
    await db.delete(serverEvents).where(and(eq(serverEvents.serverId, id), lte(serverEvents.createdAt, new Date(now))));
    await db.insert(serverEvents).values({ serverId: id, level: "system", message: `${SYSTEM} Console cleared`, createdAt: new Date(now) });
    return;
  }
  const replies = consoleReply(row.template, text);
  // Stamped just before "now" so the reply is included in this request's
  // snapshot (the console only shows events whose time has already passed).
  await db.insert(serverEvents).values([
    { serverId: id, level: "cmd", message: text, createdAt: new Date(now - 20) },
    ...replies.map((r, i) => ({ serverId: id, level: r.level, message: r.message, createdAt: new Date(now - 19 + i) })),
  ]);
  await trimEvents(id);
}

export async function listServerEvents(serverId: string): Promise<ServerEventDto[]> {
  const rows = await db
    .select()
    .from(serverEvents)
    .where(and(eq(serverEvents.serverId, serverId), lte(serverEvents.createdAt, new Date())))
    .orderBy(desc(serverEvents.createdAt), desc(serverEvents.id))
    .limit(200);
  const levels: EventLevel[] = ["info", "warn", "error", "cmd", "system"];
  return rows.reverse().map((r) => ({
    id: r.id,
    level: levels.includes(r.level as EventLevel) ? (r.level as EventLevel) : "info",
    message: r.message,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function renameServer(viewer: UserRow, id: string, name: unknown): Promise<ServerDto> {
  const { ownerName } = await getManagedServer(viewer, id);
  const next = typeof name === "string" ? name.trim() : "";
  if (next.length < 2 || next.length > 40) throw new HttpError(400, "Server name must be 2–40 characters.");
  await db.update(servers).set({ name: next }).where(eq(servers.id, id));
  const rows = await db.select().from(servers).where(eq(servers.id, id)).limit(1);
  if (!rows[0]) throw new HttpError(404, "Server not found.");
  return toServerDto(rows[0], ownerName);
}

export async function deleteServer(viewer: UserRow, id: string) {
  await getManagedServer(viewer, id);
  await db.delete(servers).where(eq(servers.id, id));
}

// ── Backups ─────────────────────────────────────────────────────────────────
// Same "lazy/pull" simulation as server power state: a backup lands as
// `creating` and is derived as `ready` once BACKUP_MS has elapsed, purely
// from the row's own createdAt — no queue or background job involved.
type BackupRow = typeof serverBackups.$inferSelect;

function effectiveBackupStatus(row: BackupRow, now = Date.now()): BackupStatus {
  return now - row.createdAt.getTime() >= BACKUP_MS ? "ready" : "creating";
}

function toBackupDto(row: BackupRow, createdByName: string | null): BackupDto {
  return {
    id: row.id,
    serverId: row.serverId,
    name: row.name,
    sizeMb: row.sizeMb,
    status: effectiveBackupStatus(row),
    createdBy: row.createdBy,
    createdByName,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listBackups(viewer: UserRow, serverId: string): Promise<BackupDto[]> {
  await getManagedServer(viewer, serverId);
  const rows = await db
    .select({ backup: serverBackups, createdByName: users.username })
    .from(serverBackups)
    .leftJoin(users, eq(serverBackups.createdBy, users.id))
    .where(eq(serverBackups.serverId, serverId))
    .orderBy(desc(serverBackups.createdAt));
  return rows.map((r) => toBackupDto(r.backup, r.createdByName));
}

export async function createBackup(viewer: UserRow, serverId: string, input: Record<string, unknown>): Promise<BackupDto> {
  const { row } = await getManagedServer(viewer, serverId);
  const existing = await db
    .select({ id: serverBackups.id })
    .from(serverBackups)
    .where(eq(serverBackups.serverId, serverId));
  if (existing.length >= MAX_BACKUPS_PER_SERVER) {
    throw new HttpError(403, `A server can keep at most ${MAX_BACKUPS_PER_SERVER} backups — delete one first.`);
  }
  const requested = typeof input.name === "string" ? input.name.trim() : "";
  const name = (requested || `Snapshot ${new Date().toLocaleString()}`).slice(0, 60);
  // Simulated archive size: a plausible slice of the server's provisioned disk.
  const sizeMb = Math.max(64, Math.round(row.diskMb * (0.35 + Math.random() * 0.35)));
  const id = newId("bak");
  const now = new Date();
  const created: BackupRow = { id, serverId, name, sizeMb, status: "creating", createdBy: viewer.id, createdAt: now };
  await db.insert(serverBackups).values(created);
  await db.insert(serverEvents).values({
    serverId,
    level: "system",
    message: `${SYSTEM} Backup "${name}" started (~${sizeMb} MB)`,
    createdAt: now,
  });
  return toBackupDto(created, viewer.username);
}

export async function deleteBackup(viewer: UserRow, serverId: string, backupId: string): Promise<void> {
  await getManagedServer(viewer, serverId);
  const existing = await db
    .select({ id: serverBackups.id })
    .from(serverBackups)
    .where(and(eq(serverBackups.id, backupId), eq(serverBackups.serverId, serverId)))
    .limit(1);
  if (!existing.length) throw new HttpError(404, "Backup not found.");
  await db.delete(serverBackups).where(and(eq(serverBackups.id, backupId), eq(serverBackups.serverId, serverId)));
}

/**
 * Restore a ready backup: the server must be fully offline (restoring a live
 * server would race the very state we're about to overwrite), then it goes
 * through the same boot-log simulation as a normal Start, prefixed with a
 * restore line so the console clearly shows what happened and why.
 */
export async function restoreBackup(viewer: UserRow, serverId: string, backupId: string): Promise<ServerDto> {
  const { row, ownerName } = await getManagedServer(viewer, serverId);
  if (effectiveStatus(row) !== "offline") {
    throw new HttpError(409, "Stop the server before restoring a backup.");
  }
  const backupRows = await db
    .select()
    .from(serverBackups)
    .where(and(eq(serverBackups.id, backupId), eq(serverBackups.serverId, serverId)))
    .limit(1);
  const backup = backupRows[0];
  if (!backup) throw new HttpError(404, "Backup not found.");
  if (effectiveBackupStatus(backup) !== "ready") throw new HttpError(409, "That backup is still being created.");

  const now = Date.now();
  const t = getTemplate(row.template);
  await db.delete(serverEvents).where(and(eq(serverEvents.serverId, serverId), gt(serverEvents.createdAt, new Date(now))));
  const patch = { status: "starting" as const, statusChangedAt: new Date(now), startedAt: new Date(now + BOOT_MS) };
  await schedule(
    serverId,
    [
      { level: "system" as const, message: `${SYSTEM} Restoring snapshot "${backup.name}" (${backup.sizeMb} MB)...` },
      ...asLines(t.bootLog),
      { message: LINES.running },
    ],
    0,
    BOOT_MS,
    now,
  );
  await db.update(servers).set(patch).where(eq(servers.id, serverId));
  const updated = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);
  if (!updated[0]) throw new HttpError(404, "Server not found.");
  await trimEvents(serverId);
  return toServerDto(updated[0], ownerName);
}

// ── Media (uploaded wallpapers) ─────────────────────────────────────────────
/** MIME types the panel accepts as wallpapers and logos. Animated GIFs and
 *  video need to survive upload byte-for-byte, so they are stored as-is.
 *  SVG is deliberately absent: it is script-capable and is served back on its
 *  own URL, so storing one would hand any admin a stored-XSS primitive. Logo
 *  uploads still accept SVG because compressImageFile rasterises them to PNG
 *  before they ever reach here. */
const MEDIA_MIME = /^(image\/(?:png|jpeg|webp|gif|avif)|video\/(?:mp4|webm|ogg|quicktime|x-matroska))$/;
const MEDIA_MIME_LABEL = "a PNG, JPEG, WebP, AVIF, GIF image or an MP4, WebM, MOV video.";
/** Base64 payloads are stored in managed MySQL, so the ceiling is a row-size
 *  budget, not a file-size budget. Video gets the larger one. */
const MEDIA_MAX_CHARS = { image: 6_000_000, video: 24_000_000 } as const;
/** Stored media is served from an extension-less path, but the client decides how
 *  to render a wallpaper from the URL alone (CSS background vs <video>), so the
 *  returned URL carries a real extension. */
const MEDIA_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
};

export async function saveMedia(user: UserRow, input: Record<string, unknown>) {
  const dataUrl = typeof input.dataUrl === "string" ? input.dataUrl : "";
  const match = dataUrl.match(/^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i);
  const mime = match?.[1]?.toLowerCase() ?? "";
  if (!match || !MEDIA_MIME.test(mime)) throw new HttpError(400, `Upload ${MEDIA_MIME_LABEL}`);
  const isVideo = mime.startsWith("video/");
  const max = isVideo ? MEDIA_MAX_CHARS.video : MEDIA_MAX_CHARS.image;
  if (match[2].length > max) {
    throw new HttpError(413, isVideo ? "Video is too large (max ~17 MB)." : "Image is too large (max ~4.5 MB).");
  }
  const id = newId("med");
  const name = (typeof input.name === "string" && input.name.trim() ? input.name.trim() : "wallpaper").slice(0, 120);
  await db.insert(mediaFiles).values({ id, name, mime, data: match[2], createdBy: user.id });
  return { id, mime, url: `/api/media/${id}.${MEDIA_EXT[mime] ?? "bin"}` };
}

export async function getMedia(id: string) {
  await ensureDatabase();
  const rows = await db.select({ mime: mediaFiles.mime, data: mediaFiles.data }).from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1);
  return rows[0] ?? null;
}

// ── Password reset tokens ──────────────────────────────────────────────────
const RESET_TTL_MS = 30 * 60_000; // 30 minutes — a leaked mailbox self-heals quickly.

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = newToken();
  const id = sha256(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await db.insert(passwordResetTokens).values({ id, userId, expiresAt });
  return token;
}

export type ConsumedReset = { userId: string } | { expired: true } | { used: true } | { invalid: true };

export async function consumePasswordResetToken(token: string): Promise<ConsumedReset> {
  const id = sha256(token);
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return { invalid: true };
  if (row.usedAt) return { used: true };
  if (row.expiresAt.getTime() < Date.now()) return { expired: true };
  return { userId: row.userId };
}

/** Atomically mark a token used and return true only if we won the race. */
async function markTokenUsedOnce(id: string): Promise<boolean> {
  const res = await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.id, id), sql`${passwordResetTokens.usedAt} is null`));
  return res[0].affectedRows > 0;
}

export async function resetPasswordWithToken(token: string, next: unknown): Promise<void> {
  if (typeof next !== "string" || next.length < 8 || next.length > 128) {
    throw new HttpError(400, "New password must be at least 8 characters.");
  }
  const result = await consumePasswordResetToken(token);
  if ("invalid" in result) throw new HttpError(400, "That reset link is invalid — request a new one.");
  if ("expired" in result) throw new HttpError(400, "That reset link has expired — request a new one.");
  if ("used" in result) throw new HttpError(400, "That reset link was already used — request a new one.");
  const id = sha256(token);
  const won = await markTokenUsedOnce(id);
  if (!won) throw new HttpError(400, "That reset link was just used — request a new one.");
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, result.userId));
  // Any existing sessions become invalid once the password changes.
  await db.delete(sessions).where(eq(sessions.userId, result.userId));
}

/** Sweep expired/unused tokens so the table doesn't grow forever. */
export async function purgePasswordResetTokens(): Promise<void> {
  const now = new Date();
  const oldUsedCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  await db.execute(sql`DELETE FROM password_reset_tokens
    WHERE expires_at < ${now} OR (used_at IS NOT NULL AND created_at < ${oldUsedCutoff})`);
}

// ── Bootstrap ───────────────────────────────────────────────────────────────
export async function getBootstrap(user: UserRow): Promise<BootstrapPayload> {
  await touchPresence(user.id);
  const admin = isAdminRole(user.role);
  const [settings, team, serverList, nodeList] = await Promise.all([
    getSettings(),
    listTeam(admin),
    listServers(user),
    listNodes(),
  ]);
  return {
    profile: toProfile({ ...user, lastSeen: new Date() }),
    settings: publicSettings(settings),
    team,
    servers: serverList,
    nodes: nodeList,
    userCount: team.length,
  };
}

export async function getLiveState(user: UserRow) {
  await touchPresence(user.id);
  const [team, serverList, nodeList] = await Promise.all([
    listTeam(isAdminRole(user.role)),
    listServers(user),
    listNodes(),
  ]);
  return { team, servers: serverList, nodes: nodeList, userCount: team.length };
}

// ── Nests & mounts ───────────────────────────────────────────────────────────
/**
 * Nests group the services ("eggs") an admin offers. The egg must be a real
 * SERVER_TEMPLATES id: a nest that named a service the panel cannot start would
 * pass validation here and then fail on every create-server attempt.
 */
type NestRow = typeof nests.$inferSelect;
type MountRow = typeof mounts.$inferSelect;

export const listNests = cache(async (): Promise<NestDto[]> => {
  await ensureDatabase();
  const rows = await db.select().from(nests).orderBy(nests.createdAt);
  return rows.map((row) => ({ id: row.id, name: row.name, description: row.description, egg: row.egg }));
});

export async function createNest(input: { name?: unknown; description?: unknown; egg?: unknown }): Promise<NestDto> {
  await ensureDatabase();
  const name = str(input.name, 40);
  if (!name) throw new HttpError(400, "Give the nest a name.");
  const egg = str(input.egg, 40) ?? "";
  if (!SERVER_TEMPLATES.some((t) => t.id === egg)) throw new HttpError(400, "Pick a service this panel can run.");
  const id = `nest_${newId("n").slice(2, 8)}`;
  const description = str(input.description, 200) ?? "";
  await db.insert(nests).values({ id, name, description, egg });
  return { id, name, description, egg };
}

export async function deleteNest(id: string): Promise<void> {
  await ensureDatabase();
  const target = String(id ?? "").trim();
  if (!target) throw new HttpError(400, "Missing nest id.");
  const existing = await db.select({ id: nests.id }).from(nests).where(eq(nests.id, target)).limit(1);
  if (!existing.length) throw new HttpError(404, "That nest no longer exists.");
  await db.delete(nests).where(eq(nests.id, target));
}

export const listMounts = cache(async (): Promise<MountDto[]> => {
  await ensureDatabase();
  const rows = await db.select().from(mounts).orderBy(mounts.createdAt);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    path: row.path,
    target: row.target,
    readOnly: row.readOnly,
    userMountable: row.userMountable,
    fstype: row.fstype,
    sizeGb: row.sizeGb,
  }));
});

const FSTYPES = new Set(["overlay", "nfs", "cifs", "ext4", "xfs", "zfs", "btrfs"]);

/** Both the host path and the in-container path end up in a mount syscall, so
 *  neither may be relative or carry shell/space metacharacters. */
const MOUNT_PATH = /^\/[A-Za-z0-9._/-]*$/;

/**
 * Host directories a mount must never expose. Handing a container the panel's
 * own config or its volume root is a straight privilege escalation: a user who
 * can start a server could then read SMTP credentials or every other server's
 * files. Mirrors Pterodactyl's Mount::$invalidSourcePaths.
 */
const INVALID_MOUNT_SOURCES = new Set([
  "/etc/pterodactyl",
  "/etc/btpanel",
  "/var/lib/pterodactyl/volumes",
  "/var/lib/btpanel",
  "/srv/daemon-data",
]);
/** In-container paths that would shadow the server's own root or home. */
const INVALID_MOUNT_TARGETS = new Set(["/", "/home/container"]);

/** Collapse a path to its canonical form so `/mnt/./storage` cannot slip past an
 *  exact-match blacklist. */
function canonicalPath(value: string): string {
  const parts: string[] = [];
  for (const segment of value.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") parts.pop();
    else parts.push(segment);
  }
  return `/${parts.join("/")}`;
}

export async function createMount(input: {
  name?: unknown;
  description?: unknown;
  path?: unknown;
  target?: unknown;
  readOnly?: unknown;
  userMountable?: unknown;
  fstype?: unknown;
  sizeGb?: unknown;
}): Promise<MountDto> {
  await ensureDatabase();
  const name = str(input.name, 64);
  if (!name) throw new HttpError(400, "Give the mount a name.");
  if (name.length < 2) throw new HttpError(400, "Mount name must be at least 2 characters.");
  // Names are the handle admins pick mounts by, so they have to be unique.
  const clash = await db.select({ id: mounts.id }).from(mounts).where(eq(mounts.name, name)).limit(1);
  if (clash.length) throw new HttpError(409, "A mount with that name already exists.");
  const path = str(input.path, 120) ?? "";
  if (!MOUNT_PATH.test(path)) throw new HttpError(400, "Source must be an absolute path, e.g. /mnt/storage.");
  const source = canonicalPath(path);
  if (INVALID_MOUNT_SOURCES.has(source)) {
    throw new HttpError(400, "That source path holds panel data and cannot be mounted into a server.");
  }
  const target = str(input.target, 120) ?? "";
  if (!MOUNT_PATH.test(target)) throw new HttpError(400, "Target must be an absolute path, e.g. /data.");
  const targetPath = canonicalPath(target);
  if (INVALID_MOUNT_TARGETS.has(targetPath)) {
    throw new HttpError(400, "That target path would shadow the server's own filesystem.");
  }
  if (source === targetPath) throw new HttpError(400, "Source and target cannot be the same path.");
  const fstype = (str(input.fstype, 16) ?? "overlay").toLowerCase();
  if (!FSTYPES.has(fstype)) throw new HttpError(400, `Filesystem must be one of: ${[...FSTYPES].join(", ")}.`);
  const description = str(input.description, 191) ?? "";
  const readOnly = bool(input.readOnly) ?? false;
  const userMountable = bool(input.userMountable) ?? false;
  const sizeGb = intIn(input.sizeGb, 1, 100_000) ?? 100;
  const id = `mnt_${newId("m").slice(2, 8)}`;
  await db.insert(mounts).values({ id, name, description, path, target, readOnly, userMountable, fstype, sizeGb });
  return { id, name, description, path, target, readOnly, userMountable, fstype, sizeGb };
}

export async function deleteMount(id: string): Promise<void> {
  await ensureDatabase();
  const target = String(id ?? "").trim();
  if (!target) throw new HttpError(400, "Missing mount id.");
  const existing = await db.select({ id: mounts.id }).from(mounts).where(eq(mounts.id, target)).limit(1);
  if (!existing.length) throw new HttpError(404, "That mount no longer exists.");
  await db.delete(mounts).where(eq(mounts.id, target));
}

// ── Two-factor authentication (TOTP) ────────────────────────────────────────
/**
 * Enrolment is two steps on purpose. `beginTotpEnrolment` stores a secret with
 * `totpEnabled` still false, so a user cannot be locked out by a secret their
 * authenticator never received; only `confirmTotpEnrolment` — which requires a
 * code generated from that exact secret — flips the flag.
 */
export async function beginTotpEnrolment(userId: string): Promise<{ secret: string; uri: string }> {
  await ensureDatabase();
  const secret = generateSecret();
  await db.update(users).set({ totpSecret: secret, totpEnabled: false }).where(eq(users.id, userId));
  const user = await findUserById(userId);
  return { secret, uri: otpauthUrl(secret, user?.username ?? userId, "BT Panel") };
}

export async function confirmTotpEnrolment(userId: string, token: unknown): Promise<void> {
  await ensureDatabase();
  const rows = await db
    .select({ secret: users.totpSecret })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const secret = rows[0]?.secret;
  if (!secret) throw new HttpError(400, "Start enrolment before confirming a code.");
  if (!verifyCode(secret, token)) throw new HttpError(401, "That code is not right. Check your app and try again.");
  await db.update(users).set({ totpEnabled: true }).where(eq(users.id, userId));
}

export async function disableTotp(userId: string): Promise<void> {
  await ensureDatabase();
  await db.update(users).set({ totpSecret: null, totpEnabled: false }).where(eq(users.id, userId));
}

export async function hasTotpEnabled(userId: string): Promise<boolean> {
  await ensureDatabase();
  const rows = await db
    .select({ enabled: users.totpEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0]?.enabled ?? false;
}

export async function verifyUserTotp(userId: string, token: unknown): Promise<boolean> {
  await ensureDatabase();
  const rows = await db
    .select({ secret: users.totpSecret })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const secret = rows[0]?.secret;
  return secret ? verifyCode(secret, token) : false;
}
