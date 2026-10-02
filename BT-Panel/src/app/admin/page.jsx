import { getSessionUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/data";
import { AdminView } from "@/components/panel/views/admin-view";
export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    const settings = await getSettings();
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--glass-tint)]">
        <div className="text-center p-8">
          <h1 className="mb-4 text-2xl font-bold">Admin Access Required</h1>
          <p className="text-steel">Please sign in as an admin to access the admin panel.</p>
        </div>
      </div>
    );
  }
  return <AdminView />;
}
