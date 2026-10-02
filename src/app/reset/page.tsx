import { redirect } from "next/navigation";
import { AuthEntry } from "@/components/auth/auth-entry";
import { pickTheme } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/data";

export default async function ResetPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string | string[] }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");
  const sp = (await searchParams) ?? {};
  const raw = sp.token;
  const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const settings = await getSettings();
  return (
    <AuthEntry
      mode="reset"
      theme={pickTheme(settings)}
      panelName={settings.panelName}
      panelLogo={settings.panelLogo}
      title="Choose a new password"
      subtitle="Enter the new password for your account"
      resetToken={token ?? ""}
    />
  );
}
