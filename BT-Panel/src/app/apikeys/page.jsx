import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientGate } from "@/components/panel/client-gate";
import { PanelShell } from "@/components/panel/shell";
import { MODE_COOKIE, parseMode } from "@/lib/panel/theme";
import { pickTheme, resolveView } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getBootstrap, getSettings } from "@/lib/server/data";
export default async function ApplicationApiPage() {
  const user = await getSessionUser();
  if (!user) {
    // No cookie session: the browser may still hold a token (third-party
    // cookies blocked in an embedded preview) — let the client decide.
    const settings = await getSettings();
    return <ClientGate theme={pickTheme(settings)} initialView={resolveView("apikeys", "owner")} />;
  }
  const [data, store] = await Promise.all([getBootstrap(user), cookies()]);
  const resolved = resolveView("apikeys", user.role);
  if (resolved !== "apikeys") redirect(resolved === "home" ? "/" : `/${resolved}`);
  return (
    <PanelShell
      initial={data}
      initialView="apikeys"
      initialModeOverride={parseMode(store.get(MODE_COOKIE)?.value)}
    />
  );
}
