import { redirect } from "next/navigation";
import { AuthEntry } from "@/components/auth/auth-entry";
import { pickTheme } from "@/lib/panel/types";
import { getSessionUser } from "@/lib/server/auth";
import { countUsers, getSettings } from "@/lib/server/data";
export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  const settings = await getSettings();
  const firstUser = (await countUsers()) === 0;
  const open = firstUser || settings.allowRegistration;
  return (
    <AuthEntry
      mode="register"
      theme={pickTheme(settings)}
      panelName={settings.panelName}
      panelLogo={settings.panelLogo}
      title={firstUser ? "Create the owner account" : "Join {panel}"}
      subtitle={
        firstUser
          ? "The first account becomes the panel owner"
          : "Create a member account to manage panel resources"
      }
      registrationOpen={open}
      firstUser={firstUser}
    />
  );
}
