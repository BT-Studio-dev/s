import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  longtext,
  mediumtext,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * BT Panel's managed MySQL schema. Timestamps are stored as UTC DATETIME(3);
 * the mysql2 connection is configured with timezone=Z. Large user media fields
 * use MEDIUMTEXT/LONGTEXT and intentionally have no SQL default.
 */
export const schemaMigrations = mysqlTable("schema_migrations", {
  id: varchar("id", { length: 80 }).primaryKey(),
  appliedAt: datetime("applied_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  username: varchar("username", { length: 24 }).notNull().unique(),
  email: varchar("email", { length: 120 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 16 }).notNull().default("member"),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  bio: varchar("bio", { length: 280 }).notNull().default(""),
  profilePic: mediumtext("profile_pic").notNull(),
  totpSecret: varchar("totp_secret", { length: 64 }),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  lastSeen: datetime("last_seen", { mode: "date", fsp: 3 }),
  lastLoginAt: datetime("last_login_at", { mode: "date", fsp: 3 }),
  createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const panelSettings = mysqlTable("panel_settings", {
  id: int("id").primaryKey(),
  themeMode: varchar("theme_mode", { length: 16 }).notNull().default("dark"),
  wallpaperUrl: varchar("wallpaper_url", { length: 2048 }).notNull().default("shader:waves"),
  bgBlur: int("bg_blur").notNull().default(0),
  bgOpacity: int("bg_opacity").notNull().default(100),
  wallpaperFit: varchar("wallpaper_fit", { length: 16 }).notNull().default("cover"),
  wallpaperZoom: int("wallpaper_zoom").notNull().default(100),
  accentColor: varchar("accent_color", { length: 16 }).notNull().default("#3b82f6"),
  glassTint: varchar("glass_tint", { length: 16 }).notNull().default("#0c1424"),
  navText: varchar("nav_text", { length: 16 }).notNull().default("#9da3b4"),
  navTextActive: varchar("nav_text_active", { length: 16 }).notNull().default("#e7e9f0"),
  glassBlur: int("glass_blur").notNull().default(20),
  glassSaturate: int("glass_saturate").notNull().default(160),
  borderRadius: int("border_radius").notNull().default(16),
  glassOpacity: int("glass_opacity").notNull().default(62),
  showTeam: boolean("show_team").notNull().default(true),
  panelName: varchar("panel_name", { length: 40 }).notNull().default("BT Panel"),
  panelSubtitle: varchar("panel_subtitle", { length: 60 }).notNull().default("Command center"),
  faviconTitle: varchar("favicon_title", { length: 60 }).notNull().default("BT Panel"),
  panelLogo: mediumtext("panel_logo").notNull(),
  faviconLogo: mediumtext("favicon_logo").notNull(),
  welcomeTitle: varchar("welcome_title", { length: 80 }).notNull().default("Welcome"),
  welcomeMessage: varchar("welcome_message", { length: 280 }).notNull().default("Manage your panel from one place."),
  showAdminStats: boolean("show_admin_stats").notNull().default(true),
  showVersion: boolean("show_version").notNull().default(true),
  showRole: boolean("show_role").notNull().default(true),
  showHeaderUser: boolean("show_header_user").notNull().default(true),
  allowRegistration: boolean("allow_registration").notNull().default(true),
  tutorialsEnabled: boolean("tutorials_enabled").notNull().default(true),
  passwordResetEnabled: boolean("password_reset_enabled").notNull().default(true),
  defaultLanguage: varchar("default_language", { length: 12 }).notNull().default("en"),
  requireTwoFactor: boolean("require_two_factor").notNull().default(false),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceMessage: varchar("maintenance_message", { length: 280 }).notNull().default(""),
  maxServersPerUser: int("max_servers_per_user").notNull().default(10),
  defaultTemplate: varchar("default_template", { length: 40 }).notNull().default("minecraft"),
  backupRetention: int("backup_retention").notNull().default(5),
  debugLogging: boolean("debug_logging").notNull().default(false),
  smtpHost: varchar("smtp_host", { length: 200 }).notNull().default(""),
  smtpPort: int("smtp_port").notNull().default(587),
  smtpSecure: boolean("smtp_secure").notNull().default(false),
  smtpUser: varchar("smtp_user", { length: 200 }).notNull().default(""),
  smtpPass: varchar("smtp_pass", { length: 400 }).notNull().default(""),
  smtpFrom: varchar("smtp_from", { length: 200 }).notNull().default("BT Panel <no-reply@btpanel.local>"),
  googleOauthEnabled: boolean("google_oauth_enabled").notNull().default(false),
  googleClientId: varchar("google_client_id", { length: 240 }).notNull().default(""),
  googleClientSecret: varchar("google_client_secret", { length: 400 }).notNull().default(""),
  googleAllowedEmail: varchar("google_allowed_email", { length: 200 }).notNull().default(""),
  updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const servers = mysqlTable(
  "servers",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: varchar("name", { length: 40 }).notNull(),
    template: varchar("template", { length: 40 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("offline"),
    statusChangedAt: datetime("status_changed_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    startedAt: datetime("started_at", { mode: "date", fsp: 3 }),
    node: varchar("node", { length: 64 }).notNull(),
    ip: varchar("ip", { length: 64 }).notNull(),
    port: int("port").notNull(),
    cpuLimit: int("cpu_limit").notNull().default(200),
    memoryMb: int("memory_mb").notNull().default(4096),
    diskMb: int("disk_mb").notNull().default(20480),
    ownerId: varchar("owner_id", { length: 64 }).references(() => users.id, { onDelete: "set null" }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("servers_owner_idx").on(t.ownerId)],
);

export const serverEvents = mysqlTable(
  "server_events",
  {
    id: int("id").autoincrement().primaryKey(),
    serverId: varchar("server_id", { length: 64 })
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    level: varchar("level", { length: 16 }).notNull().default("info"),
    message: text("message").notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("server_events_server_idx").on(t.serverId, t.createdAt)],
);

export const serverBackups = mysqlTable(
  "server_backups",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    serverId: varchar("server_id", { length: 64 })
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 60 }).notNull(),
    sizeMb: int("size_mb").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("creating"),
    createdBy: varchar("created_by", { length: 64 }).references(() => users.id, { onDelete: "set null" }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("server_backups_server_idx").on(t.serverId, t.createdAt)],
);

/** Desired Paper plugin inventory in BT Panel; this does not represent an installed JAR. */
export const serverPlugins = mysqlTable(
  "server_plugins",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    serverId: varchar("server_id", { length: 64 })
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    catalogId: varchar("catalog_id", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    version: varchar("version", { length: 60 }).notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [uniqueIndex("server_plugins_server_catalog_unique").on(t.serverId, t.catalogId)],
);

export const nodes = mysqlTable("nodes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 40 }).notNull(),
  region: varchar("region", { length: 12 }).notNull().default("EU"),
  subnet: varchar("subnet", { length: 24 }).notNull().default("10.0.0."),
  createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const mediaFiles = mysqlTable("media_files", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  mime: varchar("mime", { length: 80 }).notNull(),
  data: longtext("data").notNull(),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    usedAt: datetime("used_at", { mode: "date", fsp: 3 }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("password_reset_tokens_user_idx").on(t.userId)],
);

export const nests = mysqlTable("nests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 40 }).notNull(),
  description: varchar("description", { length: 200 }).notNull().default(""),
  egg: varchar("egg", { length: 40 }).notNull(),
  createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const mounts = mysqlTable("mounts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  description: varchar("description", { length: 191 }).notNull().default(""),
  path: varchar("path", { length: 120 }).notNull(),
  target: varchar("target", { length: 120 }).notNull().default("/mnt"),
  readOnly: boolean("read_only").notNull().default(false),
  userMountable: boolean("user_mountable").notNull().default(false),
  fstype: varchar("fstype", { length: 16 }).notNull().default("overlay"),
  sizeGb: int("size_gb").notNull().default(100),
  createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
