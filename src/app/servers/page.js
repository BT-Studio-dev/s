import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientGate } from "@/components/panel/client-gate";
import { PanelShell } from "@/components/panel/shell";
import { MODE_COOKIE, parseMode } from "@/lib/panel/theme";
import { pickTheme, resolveView } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getBootstrap, getSettings } from "@/lib/server/data";
export default async function ServersPage() {
  const user = await getSessionUser();
  if (!user) {
    const settings = await getSettings();
    return <ClientGate theme={pickTheme(settings)} initialView={resolveView("servers", "owner")} />;
  }
  const [data, store] = await Promise.all([getBootstrap(user), cookies()]);
  const resolved = resolveView("servers", user.role);
  if (resolved !== "servers") redirect(resolved === "home" ? "/" : `/${resolved}`);
  return (
    <PanelShell
      initial={data}
      initialView="servers"
      initialModeOverride={parseMode(store.get(MODE_COOKIE)?.value)}
    />
  );
}
