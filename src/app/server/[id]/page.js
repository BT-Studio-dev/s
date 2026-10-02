import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ClientGate } from "@/components/panel/client-gate";
import { PanelShell } from "@/components/panel/shell";
import { MODE_COOKIE, parseMode } from "@/lib/panel/theme";
import { pickTheme, resolveView } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getBootstrap, getServerWithEvents, getSettings } from "@/lib/server/data";

export const dynamic = "force-dynamic";

/**
 * Addressable per-server control panel.
 *
 * The server detail screen used to live only as component state inside the
 * servers list, so it had no URL: it could not be linked, bookmarked, opened
 * in a new tab, or reached by the browser's back button. This route gives
 * every server its own page at /server/<id> while reusing the same shell,
 * sidebar and detail view the list already renders.
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const settings = await getSettings().catch(() => null);
  const panelName = settings?.panelName || "BT Panel";
  return { title: `${decodeURIComponent(id)} · ${panelName}` };
}

export default async function ServerPanelPage({ params }) {
  const { id } = await params;
  const serverId = decodeURIComponent(id);

  const user = await getSessionUser();
  if (!user) {
    const settings = await getSettings();
    return <ClientGate theme={pickTheme(settings)} initialView={resolveView("servers", "owner")} />;
  }

  // Resolve the server first so an unknown id (or one this account may not
  // see) renders the 404 page instead of an empty panel.
  try {
    await getServerWithEvents(user, serverId);
  } catch {
    notFound();
  }

  const resolved = resolveView("servers", user.role);
  if (resolved !== "servers") redirect(resolved === "home" ? "/" : `/${resolved}`);

  const [data, store] = await Promise.all([getBootstrap(user), cookies()]);

  return (
    <PanelShell
      initial={data}
      initialView="servers"
      initialServerId={serverId}
      initialModeOverride={parseMode(store.get(MODE_COOKIE)?.value)}
    />
  );
}
