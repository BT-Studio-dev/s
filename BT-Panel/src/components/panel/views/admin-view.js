"use client";

import { useState } from "react";
import { Settings, ShieldCheck } from "lucide-react";
import { SettingsView } from "./settings-view";
import { UsersView } from "./users-view";
const ADMIN_TABS = [
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
  {
    id: "users",
    label: "User Management",
    icon: ShieldCheck,
  },
];
export function AdminView() {
  const [tab, setTab] = useState("settings");
  return (
    <div className="glass flex flex-col h-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[16px] font-extrabold">Admin Panel</h2>
          <p className="mt-0.5 text-[12px] font-semibold text-steel">
            Manage panel configuration, users, and updates.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ADMIN_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`pill-tab inline-flex items-center gap-1.5 ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "settings" ? <SettingsView /> : null}
        {tab === "users" ? <UsersView /> : null}
      </div>
    </div>
  );
}
