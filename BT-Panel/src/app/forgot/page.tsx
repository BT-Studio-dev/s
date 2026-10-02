import { redirect } from "next/navigation";
import { AuthEntry } from "@/components/auth/auth-entry";
import { pickTheme } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/data";

export default async function ForgotPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  const settings = await getSettings();
  return (
    <AuthEntry
      mode="forgot"
      theme={pickTheme(settings)}
      panelName={settings.panelName}
      panelLogo={settings.panelLogo}
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one"
      passwordResetEnabled={settings.passwordResetEnabled}
    />
  );
}
