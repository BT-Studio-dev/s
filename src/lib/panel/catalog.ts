/**
 * Client- and server-safe catalogs: live shader wallpapers, curated 4K
 * wallpapers, game/app server templates (with simulated daemon output),
 * and deployment nodes.
 */

// ── Live shaders ────────────────────────────────────────────────────────────
export type ShaderVariant = "waves" | "aurora" | "mesh" | "nebula";

export const SHADER_VARIANTS: { id: ShaderVariant; name: string; description: string }[] = [
  { id: "waves", name: "Flow Waves", description: "Slow layered waves washing in accent light" },
  { id: "aurora", name: "Aurora Veil", description: "Soft polar-light curtains drifting overhead" },
  { id: "mesh", name: "Plasma Mesh", description: "Three floating orbs of accent light" },
  { id: "nebula", name: "Nebula Drift", description: "Domain-warped cosmic dust with a starfield" },
];

const SHADER_PREFIX = "shader:";

export function shaderWallpaperValue(variant: ShaderVariant): string {
  return `${SHADER_PREFIX}${variant}`;
}

export function parseShaderWallpaper(url: string | undefined | null): ShaderVariant | null {
  if (!url || !url.startsWith(SHADER_PREFIX)) return null;
  const id = url.slice(SHADER_PREFIX.length);
  return SHADER_VARIANTS.some((v) => v.id === id) ? (id as ShaderVariant) : null;
}

// ── Curated wallpapers (Pexels, free to use) ────────────────────────────────
export type WallpaperItem = {
  id: string;
  title: string;
  category: "space" | "cyber" | "nature";
  thumb: string;
  full: string;
  credit: string;
};

export const WALLPAPER_CATEGORIES: { id: "all" | WallpaperItem["category"]; name: string }[] = [
  { id: "all", name: "All Wallpapers" },
  { id: "space", name: "Space & Galaxy" },
  { id: "cyber", name: "Sci-Fi & Cyberpunk" },
  { id: "nature", name: "Nature & Landscapes" },
];

function pexels(id: number, ext: "jpeg" | "png" = "jpeg") {
  const base = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${ext}?auto=compress&cs=tinysrgb`;
  return { thumb: `${base}&fit=crop&w=480&h=300`, full: `${base}&fit=crop&w=2560&h=1440` };
}

export const WALLPAPERS: WallpaperItem[] = [
  { id: "red-nebula", title: "Crimson Nebula", category: "space", credit: "Dennis Ariel", ...pexels(36489751, "png") },
  { id: "deep-nebula", title: "Deep Space Nebula", category: "space", credit: "Jeremy Müller", ...pexels(6074272) },
  { id: "milky-way", title: "Milky Way Core", category: "space", credit: "Wallace Henry", ...pexels(39360634) },
  { id: "star-veil", title: "Star Veil", category: "space", credit: "Engin Akyurt", ...pexels(6138036) },
  { id: "galaxy", title: "Galaxy Arc", category: "space", credit: "Adrien Olichon", ...pexels(2538107) },
  { id: "red-city", title: "Red Neon Skyline", category: "cyber", credit: "Pachon in Motion", ...pexels(18545010) },
  { id: "arcade", title: "Neon Arcade", category: "cyber", credit: "Michael Kessel", ...pexels(31298539) },
  { id: "cyber-street", title: "Cyberpunk Street", category: "cyber", credit: "Mikhail Nilov", ...pexels(8108316) },
  { id: "dark-peak", title: "Dark Peak", category: "nature", credit: "Francesco Ungaro", ...pexels(9286934) },
  { id: "night-tree", title: "Starry Tirol", category: "nature", credit: "Markus Partoll", ...pexels(10131034) },
  { id: "dusk-ridge", title: "Dusk Ridge", category: "nature", credit: "Andreas Ebner", ...pexels(18586193) },
  { id: "twilight", title: "Twilight Hills", category: "nature", credit: "Ivan Larin", ...pexels(10189434) },
];

// ── Server templates ────────────────────────────────────────────────────────
export type TemplateIcon = "pickaxe" | "flame" | "crosshair" | "swords" | "hexagon" | "bot" | "code";

export type ServerTemplate = {
  id: string;
  name: string;
  category: "game" | "app";
  icon: TemplateIcon;
  color: string;
  defaultPort: number;
  image: string;
  maxPlayers: number;
  bootLog: string[];
  stopLog: string[];
};

export const SERVER_TEMPLATES: ServerTemplate[] = [
  {
    id: "minecraft",
    name: "Minecraft (Paper)",
    category: "game",
    icon: "pickaxe",
    color: "#5fb04a",
    defaultPort: 25565,
    image: "ghcr.io/pterodactyl/yolks:java_21",
    maxPlayers: 40,
    bootLog: [
      "container@bt-panel~ Server marked as starting...",
      "Starting minecraft server version 1.21.4",
      "Loading properties",
      "Default game type: SURVIVAL",
      "Starting Minecraft server on 0.0.0.0:25565",
      "Preparing level \"world\"",
      "Preparing spawn area: 83%",
      "Done (4.218s)! For help, type \"help\"",
    ],
    stopLog: ["Stopping the server", "Saving players", "Saving worlds", "ThreadedAnvilChunkStorage: All dimensions are saved"],
  },
  {
    id: "rust",
    name: "Rust",
    category: "game",
    icon: "flame",
    color: "#ce422b",
    defaultPort: 28015,
    image: "ghcr.io/pterodactyl/games:rust",
    maxPlayers: 100,
    bootLog: [
      "container@bt-panel~ Server marked as starting...",
      "Loading Prefab Bundle...",
      "Initializing 13721 entity links",
      "Spawning 5210 entities from map",
      "Oxide.Rust loaded — 18 plugins",
      "Server startup complete",
      "SteamServer Initialized",
    ],
    stopLog: ["Saving world to disk...", "Kicking 0 players", "Server shutdown complete"],
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    category: "game",
    icon: "crosshair",
    color: "#f5a623",
    defaultPort: 27015,
    image: "ghcr.io/pterodactyl/games:source",
    maxPlayers: 12,
    bootLog: [
      "container@bt-panel~ Server marked as starting...",
      "Loading map \"de_dust2\"",
      "Host activate: Loading (de_dust2)",
      "VAC secure mode is activated.",
      "GC Connection established for server version 1.40.2.1",
      "Server is hibernating — waiting for players",
    ],
    stopLog: ["Dropped all clients: server shutting down", "Shutting down SteamAPI", "Server stopped"],
  },
  {
    id: "valheim",
    name: "Valheim",
    category: "game",
    icon: "swords",
    color: "#4f8fba",
    defaultPort: 2456,
    image: "ghcr.io/pterodactyl/games:valheim",
    maxPlayers: 10,
    bootLog: [
      "container@bt-panel~ Server marked as starting...",
      "Valheim version: l-0.219.16",
      "Loading world: Midgard",
      "Generating locations — 14,982 placed",
      "Game server connected",
    ],
    stopLog: ["World save writing", "World saved ( 214ms )", "Net scene destroyed"],
  },
  {
    id: "nodejs",
    name: "Node.js App",
    category: "app",
    icon: "hexagon",
    color: "#3fa037",
    defaultPort: 3000,
    image: "ghcr.io/pterodactyl/yolks:nodejs_22",
    maxPlayers: 0,
    bootLog: [
      "container@bt-panel~ Server marked as starting...",
      "> app@1.4.2 start",
      "> node dist/index.js",
      "Connected to MySQL (pool size 10)",
      "Server listening on http://0.0.0.0:3000",
    ],
    stopLog: ["SIGTERM received — draining connections", "HTTP server closed", "Process exited with code 0"],
  },
  {
    id: "discord-bot",
    name: "Discord Bot",
    category: "app",
    icon: "bot",
    color: "#5865f2",
    defaultPort: 8080,
    image: "ghcr.io/pterodactyl/yolks:nodejs_22",
    maxPlayers: 0,
    bootLog: [
      "container@bt-panel~ Server marked as starting...",
      "Loading 24 slash commands",
      "Connecting to Discord gateway (shard 0/1)",
      "Ready! Logged in as BT-Bot#0420 — serving 37 guilds",
    ],
    stopLog: ["Destroying gateway connection", "Bot offline"],
  },
  {
    id: "python",
    name: "Python App",
    category: "app",
    icon: "code",
    color: "#3776ab",
    defaultPort: 8000,
    image: "ghcr.io/pterodactyl/yolks:python_3.12",
    maxPlayers: 0,
    bootLog: [
      "container@bt-panel~ Server marked as starting...",
      "Installing requirements — already satisfied",
      "INFO:     Started server process [42]",
      "INFO:     Application startup complete.",
      "INFO:     Uvicorn running on http://0.0.0.0:8000",
    ],
    stopLog: ["INFO:     Shutting down", "INFO:     Finished server process [42]"],
  },
];

export function getTemplate(id: string): ServerTemplate {
  return SERVER_TEMPLATES.find((t) => t.id === id) ?? SERVER_TEMPLATES[0];
}

/** Curated Paper plugin picks shown in BT Panel's desired-plugin inventory. */
export const PAPER_PLUGINS = [
  { id: "essentialsx", name: "EssentialsX", description: "Common server commands and player utilities", version: "Latest compatible" },
  { id: "luckperms", name: "LuckPerms", description: "Groups, permissions, and role management", version: "Latest compatible" },
  { id: "vault", name: "Vault", description: "Permissions and economy API bridge", version: "Latest compatible" },
  { id: "worldedit", name: "WorldEdit", description: "In-game map editing tools", version: "Latest compatible" },
  { id: "placeholderapi", name: "PlaceholderAPI", description: "Placeholder expansion framework", version: "Latest compatible" },
] as const;

export type PaperPluginCatalogItem = (typeof PAPER_PLUGINS)[number];

export const MEMORY_OPTIONS = [1024, 2048, 4096, 8192, 16384];
export const CPU_OPTIONS = [100, 200, 400, 800];
export const DISK_OPTIONS = [10240, 20480, 51200, 102400];

/** Simulated daemon replies for console commands. */
export function consoleReply(templateId: string, raw: string): { level: "info" | "warn"; message: string }[] {
  const t = getTemplate(templateId);
  const command = raw.trim();
  const [head, ...rest] = command.split(/\s+/);
  const arg = rest.join(" ");
  switch (head.toLowerCase()) {
    case "help":
      return [
        { level: "info", message: "Available commands: help, list, say <msg>, status, tps, save-all, version, clear" },
      ];
    case "list":
      return [
        {
          level: "info",
          message:
            t.maxPlayers > 0
              ? `There are 0 of a max of ${t.maxPlayers} players online.`
              : "This is an application server — no player slots.",
        },
      ];
    case "say":
      return arg ? [{ level: "info", message: `[Server] ${arg}` }] : [{ level: "warn", message: "Usage: say <message>" }];
    case "status":
      return [{ level: "info", message: `${t.name} is healthy — image ${t.image}` }];
    case "tps":
      return [{ level: "info", message: "TPS from last 1m, 5m, 15m: 20.0, 20.0, 19.98" }];
    case "save-all":
      return [
        { level: "info", message: "Saving the game (this may take a moment!)" },
        { level: "info", message: "Saved the game" },
      ];
    case "version":
      return [{ level: "info", message: `${t.name} — BT Panel daemon wings v1.11.3` }];
    default:
      return [{ level: "warn", message: `Unknown command "${head}". Type "help" for help.` }];
  }
}
