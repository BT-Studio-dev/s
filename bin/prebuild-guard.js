#!/usr/bin/env node
/**
 * Prebuild guard — runs automatically before `npm run build`.
 *
 * Next.js 16 refuses to build when both the deprecated `middleware` file
 * convention and the new `proxy` convention are present:
 *
 *   Both middleware file ./src/middleware.ts and proxy file ./src/proxy.ts
 *   are detected. Please use ./src/proxy.ts only.
 *
 * The usual cause is a stale `src/middleware.ts` left behind by an older
 * checkout (git cannot delete it when the file has local modifications, so it
 * survives a `git pull`).
 *
 * This guard removes that leftover file — but ONLY when `src/proxy.ts` exists,
 * so a tree that genuinely still relies on the middleware file is never left
 * without its auth guard. The legacy `src/middleware/` DIRECTORY (Express
 * auth/upload helpers) is untouched.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const proxyCandidates = ["proxy.ts", "proxy.js", "proxy.mjs", "proxy.tsx"];
const legacyCandidates = [
  "middleware.ts",
  "middleware.js",
  "middleware.mjs",
  "middleware.tsx",
  "middleware.jsx",
];

const hasProxy = proxyCandidates.some((name) =>
  fs.existsSync(path.join(root, "src", name))
);

if (!hasProxy) {
  // Nothing to do: without a proxy file the middleware file is the only guard.
  process.exit(0);
}

let removed = 0;
for (const name of legacyCandidates) {
  const file = path.join(root, "src", name);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    fs.rmSync(file, { force: true });
    console.log(
      `[prebuild] removed stale src/${name} — the "proxy" convention is in use`
    );
    removed++;
  }
}

if (removed === 0) {
  console.log("[prebuild] guard ok — no stale middleware file found");
}
