import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientGate } from "@/components/panel/client-gate";
import { PanelShell } from "@/components/panel/shell";
import { MODE_COOKIE, parseMode } from "@/lib/panel/theme";
import { pickTheme, resolveSettingsTab, resolveView } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getBootstrap, getSettingsSafe } from "@/lib/server/data";
export default async function PanelPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    // No cookie session: the browser may still hold a token (third-party
    // cookies blocked in an embedded preview) — let the client decide.
    const settings = await getSettingsSafe();
    return <ClientGate theme={pickTheme(settings)} />;
  }
  const [data, params, store] = await Promise.all([getBootstrap(user), searchParams, cookies()]);
  const view = resolveView(params.view, user.role);
  if (view === "settings") {
    const tab = resolveSettingsTab(params.tab);
    redirect(`/settings/${tab}`);
  }
  if (view !== "home") {
    redirect(`/${view}`);
  }
  return (
    <PanelShell
      initial={data}
      initialView={view}
      initialModeOverride={parseMode(store.get(MODE_COOKIE)?.value)}
    />
  );
}
