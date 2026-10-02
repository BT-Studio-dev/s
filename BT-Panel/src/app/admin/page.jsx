import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientGate } from "@/components/panel/client-gate";
import { PanelShell } from "@/components/panel/shell";
import { MODE_COOKIE, parseMode } from "@/lib/panel/theme";
import { isAdminRole, pickTheme, resolveView } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getBootstrap, getSettings } from "@/lib/server/data";

/**
 * The admin area is the settings view rendered inside the panel shell. It has
 * to go through PanelShell because every panel view reads `usePanel()`, which
 * is only available under the provider the shell mounts.
 */
export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    const settings = await getSettings();
    return <ClientGate theme={pickTheme(settings)} initialView={resolveView("settings", "owner")} />;
  }

  if (!isAdminRole(user.role)) redirect("/");

  const [data, store] = await Promise.all([getBootstrap(user), cookies()]);

  return (
    <PanelShell
      initial={data}
      initialView="settings"
      initialModeOverride={parseMode(store.get(MODE_COOKIE)?.value)}
    />
  );
}
