import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientGate } from "@/components/panel/client-gate";
import { PanelShell } from "@/components/panel/shell";
import { MODE_COOKIE, parseMode } from "@/lib/panel/theme";
import { pickTheme, resolveView } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getBootstrap, getSettings } from "@/lib/server/data";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) {
    const settings = await getSettings();
    return <ClientGate theme={pickTheme(settings)} initialView={resolveView("users", "owner")} />;
  }
  const [data, params, store] = await Promise.all([getBootstrap(user), searchParams, cookies()]);
  const resolved = resolveView("users", user.role);
  if (resolved !== "users") redirect(resolved === "home" ? "/" : `/${resolved}`);
  return (
    <PanelShell
      initial={data}
      initialView="users"
      initialModeOverride={parseMode(store.get(MODE_COOKIE)?.value)}
    />
  );
}