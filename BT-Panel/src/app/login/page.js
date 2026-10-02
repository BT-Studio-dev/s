import { redirect } from "next/navigation";
import { AuthEntry } from "@/components/auth/auth-entry";
import { pickTheme } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/data";
export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  const settings = await getSettings();
  return (
    <AuthEntry
      mode="login"
      theme={pickTheme(settings)}
      panelName={settings.panelName}
      panelLogo={settings.panelLogo}
      title="Sign In to {panel}"
      subtitle="Enter your credentials to access the panel"
      allowRegistration={settings.allowRegistration}
      google={{
        googleOauthEnabled: settings.googleOauthEnabled,
        googleClientId: settings.googleClientId,
      }}
    />
  );
}
