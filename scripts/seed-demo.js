/**
 * Demo seeder.
 *
 * Populates a running BT Panel with a believable fleet: nodes, nests, mounts,
 * a team of users and a set of servers with plugins, backups and console
 * history. It talks to the panel's own HTTP API, so every record goes through
 * the same validation the UI uses.
 *
 *   node scripts/seed-demo.js [baseUrl]
 *
 * The first account it creates becomes the owner. Re-running against a panel
 * that already has data is safe: conflicts are skipped.
 */

const BASE = (process.argv[2] || process.env.PANEL_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

const OWNER = {
  username: "owner",
  email: "owner@btpanel.demo",
  password: "DemoOwner!2026",
};

let cookie = "";

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-btp-csrf": "1",
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const entry of setCookie) {
    const pair = entry.split(";")[0];
    if (pair.startsWith("btp_session=")) cookie = pair;
  }

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text.slice(0, 200) };
  }
  return { status: res.status, ok: res.ok, payload };
}

function log(label, detail = "") {
  console.log(`  ${label.padEnd(26)}${detail}`);
}

async function signIn() {
  const registered = await call("POST", "/api/auth/register", {
    ...OWNER,
    confirm: OWNER.password,
  });
  if (registered.ok) {
    log("owner registered", OWNER.email);
    return;
  }
  const login = await call("POST", "/api/auth/login", {
    identifier: OWNER.username,
    password: OWNER.password,
  });
  if (!login.ok) {
    throw new Error(
      `Cannot sign in as the demo owner (${login.status}). Wipe the database or remove the existing "${OWNER.username}" account first.`,
    );
  }
  log("owner signed in", OWNER.email);
}

const NODES = [
  { name: "fra-metal-01", region: "EU", subnet: "10.20.1." },
  { name: "ams-metal-02", region: "EU", subnet: "10.20.2." },
  { name: "nyc-metal-01", region: "NA", subnet: "10.40.1." },
  { name: "sgp-metal-01", region: "AP", subnet: "10.60.1." },
];

const NESTS = [
  { name: "Minecraft", egg: "minecraft", description: "Paper, Purpur and Fabric servers." },
  { name: "Survival Games", egg: "rust", description: "Rust community and modded worlds." },
  { name: "Competitive FPS", egg: "cs2", description: "Counter-Strike 2 match servers." },
  { name: "Applications", egg: "nodejs", description: "Node.js services and web APIs." },
  { name: "Bots", egg: "discord-bot", description: "Always-on Discord bots." },
];

const MOUNTS = [
  { name: "shared-worlds", path: "/srv/worlds", target: "/mnt/worlds", description: "World templates" },
  { name: "plugin-cache", path: "/srv/plugins", target: "/mnt/plugins", description: "Shared plugin jars" },
  { name: "backup-vault", path: "/srv/vault", target: "/mnt/vault", description: "Off-node backup vault", readOnly: true },
];

const TEAM = [
  { username: "mina", email: "mina@btpanel.demo", password: "DemoAdmin!2026", role: "admin" },
  { username: "tarek", email: "tarek@btpanel.demo", password: "DemoAdmin!2026", role: "admin" },
  { username: "lena", email: "lena@btpanel.demo", password: "DemoUser!2026", role: "member" },
  { username: "youssef", email: "youssef@btpanel.demo", password: "DemoUser!2026", role: "member" },
  { username: "noor", email: "noor@btpanel.demo", password: "DemoUser!2026", role: "member" },
];

const SERVERS = [
  {
    name: "survival-main",
    template: "minecraft",
    memoryMb: 8192,
    cpuLimit: 400,
    diskMb: 51200,
    plugins: ["essentialsx", "luckperms", "vault", "worldedit"],
    backups: ["nightly-full", "pre-update"],
    commands: ["say Welcome to survival!", "whitelist reload", "save-all"],
    power: "start",
  },
  {
    name: "creative-plots",
    template: "minecraft",
    memoryMb: 4096,
    cpuLimit: 200,
    diskMb: 20480,
    plugins: ["worldedit", "placeholderapi"],
    backups: ["weekly-archive"],
    commands: ["say Plot world rebuilt", "time set day"],
    power: "start",
  },
  {
    name: "skyblock-season4",
    template: "minecraft",
    memoryMb: 6144,
    cpuLimit: 300,
    diskMb: 40960,
    plugins: ["essentialsx", "luckperms"],
    backups: ["season-start"],
    commands: ["say Season 4 is live"],
    power: "start",
  },
  {
    name: "rust-vanilla",
    template: "rust",
    memoryMb: 12288,
    cpuLimit: 600,
    diskMb: 81920,
    backups: ["wipe-backup"],
    power: "start",
  },
  {
    name: "cs2-scrim",
    template: "cs2",
    memoryMb: 4096,
    cpuLimit: 200,
    diskMb: 30720,
    power: "stop",
  },
  {
    name: "valheim-friends",
    template: "valheim",
    memoryMb: 4096,
    cpuLimit: 200,
    diskMb: 20480,
    backups: ["world-snapshot"],
    power: "start",
  },
  {
    name: "api-gateway",
    template: "nodejs",
    memoryMb: 2048,
    cpuLimit: 150,
    diskMb: 10240,
    power: "start",
  },
  {
    name: "community-bot",
    template: "discord-bot",
    memoryMb: 1024,
    cpuLimit: 100,
    diskMb: 5120,
    power: "start",
  },
];

async function seed() {
  console.log(`\nSeeding BT Panel demo data at ${BASE}\n`);

  await signIn();

  const existingNodes = (await call("GET", "/api/bootstrap")).payload?.nodes ?? [];
  const nodeIds = [];
  for (const node of NODES) {
    const already = existingNodes.find((n) => n.name === node.name);
    if (already) {
      nodeIds.push(already.id);
      log("node", `${node.name} (already present)`);
      continue;
    }
    const res = await call("POST", "/api/nodes", node);
    if (res.ok) nodeIds.push(res.payload.node.id);
    log("node", `${node.name} ${res.ok ? "✓" : `(skipped ${res.status})`}`);
  }
  if (!nodeIds.length) {
    const boot = await call("GET", "/api/bootstrap");
    nodeIds.push(...(boot.payload?.nodes ?? []).map((n) => n.id));
  }

  for (const nest of NESTS) {
    const res = await call("POST", "/api/nests", nest);
    log("nest", `${nest.name} ${res.ok ? "✓" : `(skipped ${res.status})`}`);
  }

  for (const mount of MOUNTS) {
    const res = await call("POST", "/api/mounts", mount);
    log("mount", `${mount.name} ${res.ok ? "✓" : `(skipped ${res.status})`}`);
  }

  for (const member of TEAM) {
    const res = await call("POST", "/api/users", member);
    log("user", `${member.username} (${member.role}) ${res.ok ? "✓" : `(skipped ${res.status})`}`);
  }

  const existingServers = (await call("GET", "/api/bootstrap")).payload?.servers ?? [];
  for (const [index, spec] of SERVERS.entries()) {
    if (existingServers.some((s) => s.name === spec.name)) {
      log("server", `${spec.name} (already present)`);
      continue;
    }
    const created = await call("POST", "/api/servers", {
      name: spec.name,
      template: spec.template,
      node: nodeIds[index % nodeIds.length],
      memoryMb: spec.memoryMb,
      cpuLimit: spec.cpuLimit,
      diskMb: spec.diskMb,
    });
    if (!created.ok) {
      log("server", `${spec.name} (skipped ${created.status})`);
      continue;
    }

    const id = created.payload.server.id;
    const extras = [];

    for (const catalogId of spec.plugins ?? []) {
      const res = await call("POST", `/api/servers/${id}/plugins`, { catalogId });
      if (res.ok) extras.push(catalogId);
    }
    for (const name of spec.backups ?? []) {
      await call("POST", `/api/servers/${id}/backups`, { name });
    }
    if (spec.power) {
      await call("POST", `/api/servers/${id}`, { type: "power", action: spec.power });
    }
    for (const command of spec.commands ?? []) {
      await call("POST", `/api/servers/${id}`, { type: "command", command });
    }

    log(
      "server",
      `${spec.name} → ${spec.template} ✓` +
        (extras.length ? ` (${extras.length} plugins)` : "") +
        ((spec.backups ?? []).length ? ` (${spec.backups.length} backups)` : ""),
    );
  }

  await call("PUT", "/api/settings", {
    panelName: "BT Panel",
    panelSubtitle: "Demo environment",
    welcomeTitle: "Welcome to the BT Panel demo",
    welcomeMessage:
      "Every node, server and backup here is sample data. Explore freely — nothing is provisioned for real.",
    showAdminStats: true,
    showTeam: true,
  });
  log("panel settings", "demo branding ✓");

  const boot = await call("GET", "/api/bootstrap");
  const data = boot.payload ?? {};
  console.log(
    `\nDone. ${data.servers?.length ?? 0} servers, ${data.nodes?.length ?? 0} nodes, ${
      data.userCount ?? 0
    } users.`,
  );
  console.log(`\nSign in at ${BASE}/login`);
  console.log(`  username  ${OWNER.username}`);
  console.log(`  password  ${OWNER.password}\n`);
}

seed().catch((error) => {
  console.error("\nSeeding failed:", error.message);
  process.exit(1);
});
