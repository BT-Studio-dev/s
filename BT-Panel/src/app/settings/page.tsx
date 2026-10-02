import { redirect } from "next/navigation";

/** `/settings` (no sub-route) lands on the default General tab. */
export default function SettingsRoot() {
  redirect("/settings/general");
}