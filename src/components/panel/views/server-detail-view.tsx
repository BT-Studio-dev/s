"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  Cpu,
  FileText,
  Folder,
  HardDrive,
  KeyRound,
  LoaderCircle,
  Network,
  Plus,
  Play,
  Plug,
  RotateCcw,
  Save,
  Server as ServerIcon,
  Settings,
  Shield,
  Square,
  Terminal,
  Trash2,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import type { BackupDto, PowerAction, ServerDto, ServerEventDto, ServerPluginDto } from "@/lib/panel/types";
import { PAPER_PLUGINS } from "@/lib/panel/catalog";
import { formatMb, formatDuration, api } from "@/lib/utils";
import { formatRate, sampleTelemetry, type Telemetry } from "@/lib/panel/telemetry";
import { PteroStatus } from "@/components/pterodactyl";
import { usePanel } from "../context";

type DetailTab = "terminal" | "properties" | "files" | "sftp" | "subusers" | "plugins" | "settings" | "backups";
type DetailSnapshot = { server: ServerDto; events: ServerEventDto[] };

export function ServerDetailView({ server: initialServer, onBack }: { server: ServerDto; onBack: () => void }) {
  const { upsertServer, t } = usePanel();
  const [server, setServer] = useState(initialServer);
  const [events, setEvents] = useState<ServerEventDto[]>([]);
  const [backups, setBackups] = useState<BackupDto[]>([]);
  const [plugins, setPlugins] = useState<ServerPluginDto[]>([]);
  const [pluginsLoading, setPluginsLoading] = useState(false);
  const [pluginPending, setPluginPending] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>("terminal");
  const [now, setNow] = useState(0);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [powerPending, setPowerPending] = useState<PowerAction | null>(null);
  const [command, setCommand] = useState("");
  const [commandPending, setCommandPending] = useState(false);
  const [serverName, setServerName] = useState(initialServer.name);
  const [savingName, setSavingName] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [backupPending, setBackupPending] = useState(false);
  const [backupError, setBackupError] = useState(false);
  const eventLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const snapshot = await api<DetailSnapshot>(`/api/servers/${encodeURIComponent(initialServer.id)}`);
        if (!active) return;
        setServer(snapshot.server);
        setEvents(snapshot.events);
        upsertServer(snapshot.server);
      } catch (error) {
        if (active) console.error("[bt-panel] server detail refresh failed", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [initialServer.id, upsertServer]);

  useEffect(() => {
    const sample = () => {
      const at = Date.now();
      setNow(at);
      setHistory((current) => [...current.slice(-35), sampleTelemetry(server, at)]);
    };
    sample();
    const timer = window.setInterval(sample, 1000);
    return () => window.clearInterval(timer);
  }, [server]);

  useEffect(() => {
    if (eventLogRef.current) eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
  }, [events]);

  useEffect(() => {
    if (tab !== "backups") return;
    let active = true;
    const refreshBackups = async () => {
      try {
        const result = await api<{ backups: BackupDto[] }>(`/api/servers/${encodeURIComponent(server.id)}/backups`);
        if (active) {
          setBackups(result.backups);
          setBackupError(false);
        }
      } catch (error) {
        if (active) {
          setBackupError(true);
          console.error("[bt-panel] backup list refresh failed", error);
        }
      }
    };
    void refreshBackups();
    const timer = window.setInterval(() => void refreshBackups(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [tab, server.id]);

  useEffect(() => {
    if (tab !== "plugins" || server.template !== "minecraft") return;
    let active = true;
    api<{ plugins: ServerPluginDto[] }>(`/api/servers/${encodeURIComponent(server.id)}/plugins`)
      .then((result) => { if (active) setPlugins(result.plugins); })
      .catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "Could not load plugin list."); })
      .finally(() => { if (active) setPluginsLoading(false); });
    return () => { active = false; };
  }, [tab, server.id, server.template]);

  async function power(action: PowerAction) {
    if (action === "kill" && !window.confirm(t("serverDetail.confirmKill"))) return;
    setPowerPending(action);
    try {
      const snapshot = await api<DetailSnapshot>(`/api/servers/${encodeURIComponent(server.id)}`, {
        method: "POST",
        body: { type: "power", action },
      });
      setServer(snapshot.server);
      setEvents(snapshot.events);
      upsertServer(snapshot.server);
      toast.success(t(`serverDetail.power.${action}`));
    } catch (error) {
      console.error("[bt-panel] server power action failed", error);
      toast.error(t("serverDetail.actionFailed"));
    } finally {
      setPowerPending(null);
    }
  }

  async function sendCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = command.trim();
    if (!value || commandPending) return;
    setCommandPending(true);
    try {
      const snapshot = await api<DetailSnapshot>(`/api/servers/${encodeURIComponent(server.id)}`, {
        method: "POST",
        body: { type: "command", command: value },
      });
      setServer(snapshot.server);
      setEvents(snapshot.events);
      upsertServer(snapshot.server);
      setCommand("");
    } catch (error) {
      console.error("[bt-panel] server console command failed", error);
      toast.error(t("serverDetail.actionFailed"));
    } finally {
      setCommandPending(false);
    }
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingName(true);
    try {
      const result = await api<{ server: ServerDto }>(`/api/servers/${encodeURIComponent(server.id)}`, {
        method: "PATCH",
        body: { name: serverName },
      });
      setServer(result.server);
      setServerName(result.server.name);
      upsertServer(result.server);
      toast.success(t("serverDetail.nameSaved"));
    } catch (error) {
      console.error("[bt-panel] server name update failed", error);
      toast.error(t("serverDetail.actionFailed"));
    } finally {
      setSavingName(false);
    }
  }

  async function createBackup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBackupPending(true);
    try {
      const result = await api<{ backup: BackupDto; backups: BackupDto[] }>(`/api/servers/${encodeURIComponent(server.id)}/backups`, {
        method: "POST",
        body: { name: backupName },
      });
      setBackups(result.backups);
      setBackupName("");
      toast.success(t("serverDetail.backupCreated"));
    } catch (error) {
      console.error("[bt-panel] backup creation failed", error);
      toast.error(t("serverDetail.actionFailed"));
    } finally {
      setBackupPending(false);
    }
  }

  async function deleteBackup(backup: BackupDto) {
    if (!window.confirm(t("serverDetail.confirmDeleteBackup"))) return;
    setBackupPending(true);
    try {
      await api(`/api/servers/${encodeURIComponent(server.id)}/backups/${encodeURIComponent(backup.id)}`, { method: "DELETE" });
      setBackups((current) => current.filter((item) => item.id !== backup.id));
      toast.success(t("serverDetail.backupDeleted"));
    } catch (error) {
      console.error("[bt-panel] backup deletion failed", error);
      toast.error(t("serverDetail.actionFailed"));
    } finally {
      setBackupPending(false);
    }
  }

  async function restoreBackup(backup: BackupDto) {
    if (!window.confirm(t("serverDetail.confirmRestoreBackup"))) return;
    setBackupPending(true);
    try {
      const snapshot = await api<DetailSnapshot>(`/api/servers/${encodeURIComponent(server.id)}/backups/${encodeURIComponent(backup.id)}`, {
        method: "POST",
      });
      setServer(snapshot.server);
      setEvents(snapshot.events);
      upsertServer(snapshot.server);
      toast.success(t("serverDetail.backupRestoring"));
    } catch (error) {
      console.error("[bt-panel] backup restore failed", error);
      toast.error(t("serverDetail.actionFailed"));
    } finally {
      setBackupPending(false);
    }
  }

  async function addPlugin(catalogId: string) {
    setPluginPending(catalogId);
    try {
      const result = await api<{ plugin: ServerPluginDto; plugins: ServerPluginDto[] }>(`/api/servers/${encodeURIComponent(server.id)}/plugins`, {
        method: "POST",
        body: { catalogId },
      });
      setPlugins(result.plugins);
      toast.success(`${result.plugin.name} added to the tracked plugin list.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add plugin.");
    } finally {
      setPluginPending(null);
    }
  }

  async function removePlugin(plugin: ServerPluginDto) {
    setPluginPending(plugin.id);
    try {
      const result = await api<{ plugins: ServerPluginDto[] }>(`/api/servers/${encodeURIComponent(server.id)}/plugins?pluginId=${encodeURIComponent(plugin.id)}`, { method: "DELETE" });
      setPlugins(result.plugins);
      toast.success(`${plugin.name} removed from the tracked plugin list.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove plugin.");
    } finally {
      setPluginPending(null);
    }
  }

  const telemetry = sampleTelemetry(server, now);
  const status = server.status === "running" ? "online" : server.status === "offline" ? "offline" : "loading";
  const running = server.status === "running";
  const navItems: { id: DetailTab; label: string; icon: typeof Terminal; enabled: boolean }[] = [
    { id: "terminal", label: t("serverDetail.terminal"), icon: Terminal, enabled: true },
    { id: "properties", label: t("serverDetail.properties"), icon: Settings, enabled: true },
    { id: "files", label: t("serverDetail.files"), icon: Folder, enabled: false },
    { id: "sftp", label: t("serverDetail.sftp"), icon: Network, enabled: false },
    { id: "subusers", label: t("serverDetail.subusers"), icon: Shield, enabled: false },
    { id: "plugins", label: t("serverDetail.plugins"), icon: Plug, enabled: server.template === "minecraft" },
    { id: "settings", label: t("serverDetail.settings"), icon: KeyRound, enabled: false },
    { id: "backups", label: t("serverDetail.backups"), icon: FileText, enabled: true },
  ];

  return (
    <div className="space-y-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" className="btn-ghost size-10 shrink-0 p-0" onClick={onBack} aria-label={t("serverDetail.backToServers")} title={t("serverDetail.backToServers")}>
            <ArrowLeft className="size-4" />
          </button>
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: running ? "#4ade80" : server.status === "offline" ? "#94a3b8" : "#facc15" }} />
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-extrabold text-ice">{server.name}</h1>
            <p className="truncate font-mono text-[10px] font-semibold text-faint">{server.id} · {server.template}</p>
          </div>
          <PteroStatus status={status} label={t(`servers.status.${server.status}`)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <PowerButton action="start" active={server.status === "offline"} pending={powerPending} onClick={() => void power("start")} label={t("servers.action.start")} icon={<Play className="size-4" />} />
          <PowerButton action="restart" active={running} pending={powerPending} onClick={() => void power("restart")} label={t("servers.action.restart")} icon={<RotateCcw className="size-4" />} tone="warning" />
          <PowerButton action="stop" active={running || server.status === "starting"} pending={powerPending} onClick={() => void power("stop")} label={t("servers.action.stop")} icon={<Square className="size-4" />} tone="danger" />
          <PowerButton action="kill" active={running || server.status === "starting" || server.status === "stopping"} pending={powerPending} onClick={() => void power("kill")} label={t("serverDetail.kill")} icon={<Square className="size-4 fill-current" />} tone="dark" />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[205px_minmax(0,1fr)]">
        <aside className="glass flex flex-col gap-3 p-3">
          <div className="rounded-[13px] border border-line bg-fill/70 p-3">
            <div className="flex items-center gap-2 text-[12px] font-extrabold text-ice"><ServerIcon className="size-4 text-accent" /> {server.name}</div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-steel">
              <span>{t(`servers.status.${server.status}`)}</span><span className="font-mono">{server.port}</span>
            </div>
          </div>
          <nav className="flex gap-1.5 overflow-x-auto xl:flex-col" aria-label={t("serverDetail.serverMenu")}>
            {navItems.map(({ id, label, icon: Icon, enabled }) => (
              <button
                key={id}
                type="button"
                disabled={!enabled}
                title={!enabled ? t("serverDetail.requiresWings") : undefined}
                onClick={() => {
                  if (!enabled) return;
                  if (id === "plugins") setPluginsLoading(true);
                  setTab(id);
                }}
                className={`flex min-h-10 shrink-0 items-center gap-2.5 rounded-[10px] px-3 text-left text-[11.5px] font-bold transition ${!enabled ? "cursor-not-allowed opacity-40" : tab === id ? "bg-accent/15 text-accent" : "text-steel hover:bg-fill hover:text-ice"}`}
              >
                <Icon className="size-4" />{label}
              </button>
            ))}
          </nav>
          <p className="mt-auto rounded-[10px] border border-line bg-fill/40 p-2.5 text-[10px] font-semibold leading-relaxed text-faint">{t("serverDetail.requiresWings")}</p>
        </aside>

        <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_285px]">
          <main className="min-w-0">
            {tab === "terminal" ? (
              <section className="glass overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                  <div><h2 className="text-[13px] font-extrabold text-ice">{t("serverDetail.consoleTitle")}</h2><p className="text-[10px] font-semibold text-faint">{t("serverDetail.consoleHint")}</p></div>
                  <span className="rounded-full border border-line bg-fill px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-warning">{t("serverDetail.simulated")}</span>
                </div>
                <div ref={eventLogRef} className="h-[min(55vh,560px)] min-h-[300px] overflow-y-auto bg-[#080b0e] px-3 py-3 font-mono text-[10.5px] leading-[1.65] text-[#d6e0e7] sm:px-4">
                  {loading && events.length === 0 ? <p className="text-[#89949c]">{t("serverDetail.loadingConsole")}</p> : null}
                  {!loading && events.length === 0 ? <p className="text-[#89949c]">{t("serverDetail.noConsoleOutput")}</p> : null}
                  {events.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-[76px_42px_minmax(0,1fr)] gap-2 whitespace-pre-wrap break-words">
                      <time className="text-[#74818b]">{new Date(entry.createdAt).toISOString().slice(11, 19)}</time>
                      <span className={entry.level === "error" ? "text-red-400" : entry.level === "warn" ? "text-amber-300" : entry.level === "cmd" ? "text-cyan-300" : "text-emerald-300"}>[{entry.level}]</span>
                      <span>{entry.message}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={(event) => void sendCommand(event)} className="flex items-center gap-2 border-t border-line bg-fill px-3 py-2.5">
                  <span className="font-mono text-[12px] text-accent">›</span>
                  <input className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-ice outline-none placeholder:text-faint" value={command} onChange={(event) => setCommand(event.target.value)} placeholder={running ? t("serverDetail.commandPlaceholder") : t("serverDetail.startToUseConsole")} disabled={!running || commandPending} maxLength={200} />
                  <button type="submit" className="btn-accent min-h-8 px-3 text-[10px]" disabled={!running || commandPending || !command.trim()}>{commandPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Terminal className="size-3.5" />}{t("serverDetail.send")}</button>
                </form>
              </section>
            ) : null}

            {tab === "properties" ? (
              <section className="glass p-4 sm:p-5">
                <h2 className="text-[15px] font-extrabold text-ice">{t("serverDetail.properties")}</h2>
                <p className="mt-1 text-[11px] font-semibold text-steel">{t("serverDetail.propertiesHint")}</p>
                <form onSubmit={(event) => void saveName(event)} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <label className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-steel">{t("serverDetail.serverName")}
                    <input className="panel-input" value={serverName} onChange={(event) => setServerName(event.target.value)} maxLength={40} minLength={2} required />
                  </label>
                  <button type="submit" className="btn-accent" disabled={savingName || serverName.trim() === server.name}>{savingName ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{t("serverDetail.saveName")}</button>
                </form>
                <dl className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Property label={t("servers.address")} value={`${server.ip}:${server.port}`} />
                  <Property label={t("servers.node")} value={server.node} />
                  <Property label={t("servers.resource.cpu")} value={`${server.cpuLimit}%`} />
                  <Property label={t("servers.resource.memory")} value={formatMb(server.memoryMb)} />
                  <Property label={t("servers.resource.disk")} value={formatMb(server.diskMb)} />
                  <Property label={t("serverDetail.template")} value={server.template} />
                </dl>
              </section>
            ) : null}

            {tab === "plugins" ? (
              <section className="glass p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="text-[15px] font-extrabold text-ice">Paper plugins</h2><p className="mt-1 text-[11px] font-semibold text-steel">Track the plugins you intend to use on this server.</p></div>
                  <span className="rounded-full border border-line bg-fill px-2.5 py-1 text-[10px] font-bold text-steel">{plugins.length} tracked</span>
                </div>
                <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-[10.5px] font-semibold leading-relaxed text-ice">
                  Plugin list only: BT Panel saves these entries but does not download JAR files or install/enable plugins. A real Pterodactyl/Wings integration is required for that.
                </div>
                <div className="mt-4 grid gap-2">
                  {pluginsLoading ? <p className="text-[11px] font-semibold text-steel">Loading plugin inventory…</p> : null}
                  {!pluginsLoading && plugins.length === 0 ? <p className="rounded-xl border border-dashed border-line-strong bg-fill/30 p-5 text-center text-[11px] font-semibold text-steel">No plugins tracked yet. Add one from the curated Paper list below.</p> : null}
                  {plugins.map((plugin) => (
                    <div key={plugin.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-fill/50 p-3">
                      <span className="grid size-9 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent"><Plug className="size-4" /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-extrabold text-ice">{plugin.name}</p><p className="text-[10px] font-semibold text-steel">{plugin.version} · tracked in panel</p></div>
                      <button type="button" className="btn-ghost min-h-8 px-2.5 text-[10px] text-danger" disabled={pluginPending !== null} onClick={() => void removePlugin(plugin)}>{pluginPending === plugin.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Remove</button>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-line pt-4">
                  <h3 className="text-[12px] font-extrabold text-ice">Add from catalog</h3>
                  <div className="mt-2 grid gap-2 lg:grid-cols-2">
                    {PAPER_PLUGINS.filter((item) => !plugins.some((plugin) => plugin.catalogId === item.id)).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-line bg-fill/35 p-3">
                        <div className="min-w-0 flex-1"><p className="text-[11px] font-extrabold text-ice">{item.name}</p><p className="mt-0.5 text-[10px] font-semibold text-steel">{item.description}</p></div>
                        <button type="button" className="btn-accent min-h-8 px-2.5 text-[10px]" disabled={pluginPending !== null || pluginsLoading} onClick={() => void addPlugin(item.id)}>{pluginPending === item.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add</button>
                      </div>
                    ))}
                    {!pluginsLoading && plugins.length === PAPER_PLUGINS.length ? <p className="text-[10px] font-semibold text-faint">All catalog entries are already tracked for this server.</p> : null}
                  </div>
                </div>
              </section>
            ) : null}

            {tab === "backups" ? (
              <section className="glass p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="text-[15px] font-extrabold text-ice">{t("serverDetail.backups")}</h2><p className="mt-1 text-[11px] font-semibold text-steel">{t("serverDetail.backupsHint")}</p></div>
                  <span className="rounded-full border border-line bg-fill px-2.5 py-1 text-[10px] font-bold text-steel">{backups.length}</span>
                </div>
                <form onSubmit={(event) => void createBackup(event)} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input className="panel-input min-w-0 flex-1" value={backupName} onChange={(event) => setBackupName(event.target.value)} maxLength={60} placeholder={t("serverDetail.backupNamePlaceholder")} />
                  <button className="btn-accent" type="submit" disabled={backupPending}>{backupPending ? <LoaderCircle className="size-4 animate-spin" /> : <FileText className="size-4" />}{t("serverDetail.createBackup")}</button>
                </form>
                <div className="mt-4 grid gap-2">
                  {backupError ? <p className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-[11px] font-bold text-danger">{t("serverDetail.backupsUnavailable")}</p> : null}
                  {backups.length === 0 && !backupError ? <p className="rounded-xl border border-dashed border-line-strong bg-fill/30 p-6 text-center text-[11px] font-semibold text-steel">{t("serverDetail.noBackups")}</p> : null}
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex flex-col gap-3 rounded-xl border border-line bg-fill/50 p-3 sm:flex-row sm:items-center">
                      <FileText className="size-4 shrink-0 text-accent" />
                      <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-extrabold text-ice">{backup.name}</p><p className="text-[10px] font-semibold text-steel">{formatMb(backup.sizeMb)} · {new Date(backup.createdAt).toISOString().slice(0, 16).replace("T", " ")} UTC · {backup.status === "ready" ? t("serverDetail.backupReady") : t("serverDetail.backupCreating")}</p></div>
                      <div className="flex gap-2">
                        <button type="button" className="btn-ghost min-h-8 px-2.5 text-[10px]" disabled={backupPending || backup.status !== "ready" || server.status !== "offline"} onClick={() => void restoreBackup(backup)} title={server.status !== "offline" ? t("serverDetail.stopBeforeRestore") : undefined}><RotateCcw className="size-3.5" />{t("serverDetail.restore")}</button>
                        <button type="button" className="btn-ghost min-h-8 px-2.5 text-[10px] text-danger" disabled={backupPending} onClick={() => void deleteBackup(backup)} aria-label={`${t("serverDetail.deleteBackup")} ${backup.name}`}><Trash2 className="size-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </main>

          <aside className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
            <MetricCard icon={<Wifi className="size-4" />} title={t("serverDetail.address")} value={String(server.port)} detail={`${server.ip}:${server.port}`} series={history.map(() => 1)} />
            <MetricCard icon={<Activity className="size-4" />} title={t("serverDetail.uptime")} value={running && server.startedAt ? formatDuration(now - new Date(server.startedAt).getTime()) : "—"} detail={running ? t("serverDetail.sinceStart") : t(`servers.status.${server.status}`)} series={history.map(() => running ? 1 : 0)} />
            <MetricCard icon={<Cpu className="size-4" />} title={t("serverDetail.cpuLoad")} value={`${telemetry.cpu.toFixed(2)}%`} detail={`${t("serverDetail.ofLimit")} ${server.cpuLimit}%`} series={history.map((sample) => sample.cpu)} />
            <MetricCard icon={<Activity className="size-4" />} title={t("serverDetail.memory")} value={formatMb(telemetry.memMb)} detail={`${t("serverDetail.ofLimit")} ${formatMb(server.memoryMb)}`} series={history.map((sample) => sample.memMb)} />
            <MetricCard icon={<HardDrive className="size-4" />} title={t("serverDetail.disk")} value={formatMb(telemetry.diskMb)} detail={`${t("serverDetail.ofLimit")} ${formatMb(server.diskMb)}`} series={history.map((sample) => sample.diskMb)} />
            <MetricCard icon={<Network className="size-4" />} title={t("serverDetail.networkIn")} value={formatRate(telemetry.netIn)} detail={`${t("serverDetail.networkOut")} ${formatRate(telemetry.netOut)}`} series={history.map((sample) => sample.netIn + sample.netOut)} />
            <p className="sm:col-span-2 rounded-lg border border-line bg-fill/30 p-2.5 text-[9.5px] font-semibold leading-relaxed text-faint 2xl:col-span-1">{t("serverDetail.simulatedMetrics")}</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PowerButton({ action, active, pending, onClick, label, icon, tone = "normal" }: { action: PowerAction; active: boolean; pending: PowerAction | null; onClick: () => void; label: string; icon: ReactNode; tone?: "normal" | "warning" | "danger" | "dark" }) {
  const colors = tone === "warning" ? "bg-amber-500 hover:bg-amber-400" : tone === "danger" ? "bg-rose-600 hover:bg-rose-500" : tone === "dark" ? "bg-red-900 hover:bg-red-800" : "bg-emerald-600 hover:bg-emerald-500";
  return <button type="button" className={`flex size-10 items-center justify-center rounded-full text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-35 sm:h-11 sm:min-w-[70px] sm:gap-2 sm:rounded-full sm:px-4 sm:text-[10px] sm:font-extrabold`} disabled={!active || pending !== null} onClick={onClick} title={label} aria-label={label}>
    {pending === action ? <LoaderCircle className="size-4 animate-spin" /> : <span className={`grid size-10 place-items-center rounded-full ${colors}`}>{icon}</span>}
    <span className="hidden sm:inline">{label}</span>
  </button>;
}

function Property({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-line bg-fill/50 px-3 py-2.5"><dt className="text-[9px] font-extrabold uppercase tracking-wide text-faint">{label}</dt><dd className="mt-1 truncate text-[12px] font-bold text-ice">{value}</dd></div>;
}

function MetricCard({ icon, title, value, detail, series }: { icon: ReactNode; title: string; value: string; detail: string; series: number[] }) {
  const max = Math.max(1, ...series);
  const points = series.map((n, index) => `${series.length < 2 ? 0 : (index / (series.length - 1)) * 100},${46 - (n / max) * 38}`).join(" ");
  return <section className="glass overflow-hidden p-3">
    <div className="flex items-center gap-2 text-[10px] font-bold text-steel"><span className="text-accent">{icon}</span>{title}</div>
    <div className="mt-1 text-[15px] font-extrabold text-ice">{value}</div>
    <div className="text-[9.5px] font-semibold text-faint">{detail}</div>
    <svg className="mt-1 h-8 w-full text-accent/90" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>
  </section>;
}
