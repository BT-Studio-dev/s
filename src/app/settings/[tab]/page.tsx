import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientGate } from "@/components/panel/client-gate";
import { PanelShell } from "@/components/panel/shell";
import { MODE_COOKIE, parseMode } from "@/lib/panel/theme";
import { pickTheme, resolveSettingsTab, resolveView, SETTINGS_TABS } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getBootstrap, getSettings } from "@/lib/server/data";

export function generateStaticParams() {
  return SETTINGS_TABS.map((tab) => ({ tab }));
}

export default async function SettingsTabPage({
  params,
  searchParams,
}: {
  params: Promise<{ tab: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tab } = await params;
  const settingsTab = resolveSettingsTab(tab);
  if (settingsTab !== tab) {
    redirect(`/settings/${settingsTab}`);
  }
  const user = await getSessionUser();
  if (!user) {
    // No cookie session: the browser may still hold a token (third-party
    // cookies blocked in an embedded preview) — let the client decide.
    const settings = await getSettings();
    return <ClientGate theme={pickTheme(settings)} initialView="settings" initialSettingsTab={settingsTab} />;
  }
  const [data, params2, store] = await Promise.all([getBootstrap(user), searchParams, cookies()]);
  if (resolveView("settings", user.role) !== "settings") {
    redirect("/");
  }
  return (
    <PanelShell
      initial={data}
      initialView="settings"
      initialSettingsTab={settingsTab}
      initialModeOverride={parseMode(store.get(MODE_COOKIE)?.value)}
    />
  );
}