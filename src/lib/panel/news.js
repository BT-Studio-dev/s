/**
 * Panel release notes ("What's new").
 *
 * Kept as plain data so the Updates view, the sidebar badge and the sign-in
 * screens all read the same list. Newest entry first — `NEWS[0]` is treated as
 * the current release everywhere.
 *
 * `kind` drives the colour of an item's tag:
 *   added   — new capability
 *   fixed   — bug fix
 *   changed — behaviour or default that moved
 */

export const NEWS = [
  {
    version: "v2.1.1",
    date: "2026-10-02",
    title: "Server panel, artwork and a red default",
    summary:
      "A dedicated per-server control panel, the shipped artwork finally put to use, and a few papercuts in theming and sessions cleared out.",
    items: [
      {
        kind: "added",
        text: "New server panel module with console, resources, backups, plugins, network and settings tabs.",
      },
      {
        kind: "added",
        text: "Per-server page at /server/<id>, linked from the server list and addressable directly.",
      },
      {
        kind: "added",
        text: "Language flags in the switcher and real server-software logos on server cards.",
      },
      {
        kind: "changed",
        text: "The default accent is now red (#d00000) for fresh installs.",
      },
      {
        kind: "fixed",
        text: "Copy buttons work again where the Clipboard API is blocked by a permissions policy.",
      },
      {
        kind: "fixed",
        text: "An expired session now redirects reliably instead of matching a translated error message.",
      },
      {
        kind: "fixed",
        text: "A status badge no longer crashes the page when a server reports an unexpected lifecycle state.",
      },
    ],
  },
  {
    version: "v2.1.0",
    date: "2026-09-24",
    title: "Live shaders and glassmorphism",
    summary:
      "Four accent-aware WebGL backgrounds plus full control over blur, tint and transparency.",
    items: [
      {
        kind: "added",
        text: "Live shader wallpapers: Flow Waves, Aurora Veil, Plasma Mesh and Nebula Drift.",
      },
      {
        kind: "added",
        text: "Wallpaper library with uploads, external URLs and video backgrounds.",
      },
      {
        kind: "changed",
        text: "Shaders re-tint instantly when the accent colour changes, with a static frame for reduced-motion users.",
      },
    ],
  },
  {
    version: "v2.0.0",
    date: "2026-09-02",
    title: "The panel rewrite",
    summary:
      "Rebuilt on the Next.js App Router with a single shared panel shell and URL-addressable views.",
    items: [
      {
        kind: "added",
        text: "Nodes, locations, nests, mounts, users and application API management.",
      },
      {
        kind: "added",
        text: "Four UI languages with a per-user dark and light override.",
      },
      {
        kind: "changed",
        text: "Every panel view now has its own URL and survives a refresh or a shared link.",
      },
    ],
  },
];

/** The current release — the entry the panel reports as its version. */
export const LATEST = NEWS[0];

export const NEWS_KINDS = {
  added: {
    label: "New",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  fixed: {
    label: "Fixed",
    className: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  },
  changed: {
    label: "Changed",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
};

/** Tag styling for an item, falling back to "changed" for unknown kinds. */
export function newsKind(kind) {
  return NEWS_KINDS[kind] ?? NEWS_KINDS.changed;
}

/** Release date rendered in the viewer's locale, safe against a bad value. */
export function formatNewsDate(value, locale) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale || undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
