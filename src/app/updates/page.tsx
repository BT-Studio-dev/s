import { redirect } from "next/navigation";

/** This build has no Updates view yet; avoid rendering an unsupported route. */
export default function UpdatesPage() {
  redirect("/");
}
