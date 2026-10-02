"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRightLeft, Search, Server, Trash, UserPlus } from "lucide-react";
import type { PanelProfile, PanelRole, ServerDto } from "@/lib/panel/types";
import { api, cn, formatJoined, timeAgo } from "@/lib/utils";
import { usePanel } from "../context";
import { PresenceAvatar, Spinner, useNow } from "../ui";

export function UsersView() {
  const { team, setTeam, profile, servers, setServers, isAdmin } = usePanel();
  const now = useNow(30000);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "member" as "member" | "admin" });
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);
  const isOwner = profile.role === "owner";
  const isOnline = (u: PanelProfile) => u.online || u.userId === profile.userId;
  const canManage = (u: PanelProfile) => u.userId !== profile.userId && u.role !== "owner" && (isOwner || u.role !== "admin");

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ team: PanelProfile[] }>("/api/users", { body: form });
      setTeam(res.team);
      toast.success(`${form.username} created`);
      setForm({ username: "", email: "", password: "", role: "member" });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setBusy(false);
    }
  }

  async function mutate(user: PanelProfile, method: "PATCH" | "DELETE", body: Record<string, unknown> | undefined, success: string) {
    setPendingId(user.userId);
    try {
      const res = await api<{ team: PanelProfile[] }>(`/api/users/${user.userId}`, { method, body });
      setTeam(res.team);
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setPendingId(null);
    }
  }

  async function transferServer() {
    const selected = servers.find((server) => server.id === selectedServerId);
    if (!selected) return;
    setTransferBusy(true);
    try {
      const res = await api<{ server: ServerDto }>(`/api/servers/${encodeURIComponent(selected.id)}/owner`, {
        method: "PATCH",
        body: { ownerId: selectedOwnerId || null },
      });
      setServers(servers.map((server) => (server.id === res.server.id ? res.server : server)));
      toast.success(`${res.server.name} is now assigned to ${res.server.ownerName ?? "nobody"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not transfer server");
    } finally {
      setTransferBusy(false);
    }
  }

  const q = query.trim().toLowerCase();
  const list = team.filter((u) => !q || [u.username, u.email, u.role].some((v) => v.toLowerCase().includes(q)));

  return (
    <div className="glass overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[16px] font-extrabold">User Management</h2>
          <p className="mt-0.5 text-[12px] font-semibold text-steel">
            {team.length} accounts · {team.filter(isOnline).length} online now
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel" />
            <input className="panel-input w-56 pl-9" placeholder="Search users…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button type="button" className={open ? "btn-ghost" : "btn-accent"} onClick={() => setOpen((v) => !v)}>
            {open ? (
              "Cancel"
            ) : (
              <>
                <UserPlus className="size-4" /> Add User
              </>
            )}
          </button>
        </div>
      </div>

      {isAdmin ? (
        <section className="border-b border-line bg-sunken/30 px-5 py-4" aria-label="Server ownership management">
          <div className="mb-3 flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] border border-accent/25 bg-accent/10 text-accent">
              <Server className="size-4" />
            </span>
            <div>
              <h3 className="text-[13px] font-extrabold">Server ownership</h3>
              <p className="mt-0.5 text-[11.5px] font-semibold text-steel">Reassign a server to an active user or leave it unassigned. Transfers are recorded in the server event log.</p>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="sr-only" htmlFor="transfer-server">Server</label>
            <select
              id="transfer-server"
              className="panel-input min-w-0"
              value={selectedServerId}
              onChange={(event) => {
                const id = event.target.value;
                setSelectedServerId(id);
                setSelectedOwnerId(servers.find((server) => server.id === id)?.ownerId ?? "");
              }}
            >
              <option value="">Choose a server…</option>
              {servers.map((server) => <option key={server.id} value={server.id}>{server.name} — {server.ownerName ?? "Unassigned"}</option>)}
            </select>
            <label className="sr-only" htmlFor="transfer-owner">New owner</label>
            <select id="transfer-owner" className="panel-input min-w-0" value={selectedOwnerId} onChange={(event) => setSelectedOwnerId(event.target.value)}>
              <option value="">Unassigned</option>
              {team.filter((user) => user.status === "active").map((user) => <option key={user.userId} value={user.userId}>{user.username} ({user.role})</option>)}
            </select>
            <button
              type="button"
              className="btn-accent whitespace-nowrap"
              disabled={transferBusy || !selectedServerId || servers.find((server) => server.id === selectedServerId)?.ownerId === (selectedOwnerId || null)}
              onClick={() => void transferServer()}
            >
              {transferBusy ? <Spinner /> : <ArrowRightLeft className="size-4" />} Transfer
            </button>
          </div>
          {servers.length === 0 ? <p className="mt-2 text-[11.5px] font-semibold text-faint">No servers are available to reassign.</p> : null}
        </section>
      ) : null}

      {open ? (
        <form onSubmit={onCreate} className="view-enter grid gap-3 border-b border-line p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input className="panel-input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required autoFocus />
          <input className="panel-input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input
            className="panel-input"
            placeholder="Password (8+ characters)"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
          <div className="flex gap-2">
            <select className="panel-input w-32" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "member" | "admin" })}>
              <option value="member">Member</option>
              {isOwner ? <option value="admin">Admin</option> : null}
            </select>
            <button type="submit" className="btn-accent shrink-0" disabled={busy}>
              {busy ? <Spinner /> : null} Create
            </button>
          </div>
        </form>
      ) : null}

      <div className="scrollbar-thin overflow-x-auto">
        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last seen</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((user) => (
              <tr key={user.userId}>
                <td>
                  <div className="flex items-center gap-3">
                    <PresenceAvatar name={user.username} src={user.profilePic} size="sm" online={isOnline(user)} />
                    <div className="min-w-0">
                      <div className="font-extrabold">
                        {user.username}
                        {user.userId === profile.userId ? (
                          <span className="ml-2 rounded-full bg-accent/20 px-1.5 py-0.5 text-[9.5px] font-extrabold text-accent">YOU</span>
                        ) : null}
                      </div>
                      <div className="max-w-[220px] truncate text-[11.5px] font-semibold text-faint">{user.bio || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="text-[13px] font-semibold text-steel">{user.email || "—"}</td>
                <td>
                  {isOwner && user.role !== "owner" && user.userId !== profile.userId ? (
                    <select
                      className="panel-input min-h-9 w-28 py-1 text-[12px]"
                      value={user.role}
                      disabled={pendingId === user.userId}
                      onChange={(e) => void mutate(user, "PATCH", { role: e.target.value }, `${user.username} is now ${e.target.value}`)}
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <RoleChip role={user.role} />
                  )}
                </td>
                <td>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[11.5px] font-extrabold tracking-wide uppercase",
                      user.status === "active" ? "text-ok" : "text-danger",
                    )}
                  >
                    <span className={cn("status-dot", user.status === "active" && "running")} />
                    {user.status}
                  </span>
                </td>
                <td className="text-[12.5px] font-semibold text-steel">
                  {isOnline(user) ? <span className="text-ok">Online</span> : now ? timeAgo(user.lastSeen, now) : "—"}
                </td>
                <td className="text-[12.5px] font-semibold text-steel">{formatJoined(user.createdAt)}</td>
                <td className="text-right">
                  {canManage(user) ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn-ghost min-h-9 px-3 text-[12px]"
                        disabled={pendingId === user.userId}
                        onClick={() =>
                          void mutate(
                            user,
                            "PATCH",
                            { status: user.status === "active" ? "suspended" : "active" },
                            user.status === "active" ? `${user.username} suspended` : `${user.username} restored`,
                          )
                        }
                      >
                        {user.status === "active" ? "Suspend" : "Restore"}
                      </button>
                      <button
                        type="button"
                        className="btn-danger min-h-9"
                        disabled={pendingId === user.userId}
                        onClick={() => {
                          if (window.confirm(`Delete ${user.username}? Their servers remain but lose their owner.`)) {
                            void mutate(user, "DELETE", undefined, `${user.username} deleted`);
                          }
                        }}
                      >
                        <Trash className="size-3.5" /> Delete
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 ? <p className="px-5 py-8 text-center text-[13px] font-semibold text-steel">No users match “{query}”.</p> : null}
      </div>
    </div>
  );
}

function RoleChip({ role }: { role: PanelRole }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase",
        role === "owner" ? "bg-accent text-white" : role === "admin" ? "border border-accent/40 bg-accent/12 text-accent" : "border border-line bg-fill text-steel",
      )}
    >
      {role}
    </span>
  );
}
