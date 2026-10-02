"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Cpu,
  HardDrive,
  Play,
  RotateCcw,
  Server as ServerIcon,
  Square,
  LoaderCircle,
  Terminal,
  Plus,
  X,
} from "lucide-react";
import { CPU_OPTIONS, DISK_OPTIONS, MEMORY_OPTIONS, SERVER_TEMPLATES } from "@/lib/panel/catalog";
import { api, formatMb } from "@/lib/utils";
import {
  PteroEmpty,
  PteroPage,
  PteroPageHeader,
  PteroSearch,
  PteroStat,
  PteroStatGrid,
  PteroStatus,
} from "@/components/pterodactyl";
import { usePanel } from "../context";
import { ServerDetailView } from "./server-detail-view";
export function ServersView() {
  const { servers, nodes, isAdmin, setView, upsertServer, t } = usePanel();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [pending, setPending] = useState(null);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTemplate, setNewTemplate] = useState("minecraft");
  const [newNode, setNewNode] = useState(nodes[0]?.id ?? "");
  const [newCpu, setNewCpu] = useState(200);
  const [newMemory, setNewMemory] = useState(4096);
  const [newDisk, setNewDisk] = useState(20480);
  const runningCount = servers.filter((server) => server.status === "running").length;
  const offlineCount = servers.filter((server) => server.status === "offline").length;
  const visibleServers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return servers.filter((server) => {
      const matchesQuery =
        !needle ||
        [server.name, server.template, server.node, server.ip, server.id].some((value) =>
          value.toLowerCase().includes(needle),
        );
      const matchesFilter =
        filter === "all" ||
        (filter === "running" ? server.status === "running" : server.status === "offline");
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, servers]);
  const selectedServer = selectedServerId
    ? servers.find((server) => server.id === selectedServerId)
    : undefined;
  if (selectedServer)
    return <ServerDetailView server={selectedServer} onBack={() => setSelectedServerId(null)} />;
  async function power(server, action) {
    setPending({
      id: server.id,
      action,
    });
    try {
      const result = await api(`/api/servers/${encodeURIComponent(server.id)}`, {
        method: "POST",
        body: {
          type: "power",
          action,
        },
      });
      upsertServer(result.server);
      const message =
        action === "start"
          ? t("servers.toast.started")
          : action === "stop"
            ? t("servers.toast.stopped")
            : t("servers.toast.restarted");
      toast.success(`${server.name} ${message}`);
    } catch (error) {
      console.error("[bt-panel] server power action failed", error);
      toast.error(t("servers.toast.failed"));
    } finally {
      setPending(null);
    }
  }
  async function createServer(event) {
    event.preventDefault();
    if (!nodes.length) return;
    setCreatePending(true);
    try {
      const result = await api("/api/servers", {
        method: "POST",
        body: {
          name: newName,
          template: newTemplate,
          node: newNode,
          cpuLimit: newCpu,
          memoryMb: newMemory,
          diskMb: newDisk,
        },
      });
      upsertServer(result.server);
      setNewName("");
      setCreateOpen(false);
      toast.success(
        "Server record created. Live provisioning requires a connected game-server daemon.",
      );
    } catch (error) {
      console.error("[bt-panel] server creation failed", error);
      toast.error(error instanceof Error ? error.message : "Could not create the server.");
    } finally {
      setCreatePending(false);
    }
  }
  return (
    <PteroPage>
      <PteroPageHeader
        title={t("view.servers")}
        description={t("servers.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line bg-fill px-3 py-1.5 text-[11px] font-bold text-steel">
              {servers.length} {t("servers.totalSuffix")}
            </span>
            <button
              type="button"
              className="btn-accent min-h-10 px-3 text-[11px]"
              onClick={() => setCreateOpen((value) => !value)}
            >
              {createOpen ? <X className="size-4" /> : <Plus className="size-4" />}
              {createOpen ? "Close" : "Create server"}
            </button>
          </div>
        }
      />

      {createOpen ? (
        <form
          onSubmit={(event) => void createServer(event)}
          className="glass grid gap-4 p-4 sm:p-5"
        >
          <div>
            <h2 className="text-[15px] font-extrabold text-ice">Create a game server</h2>
            <p className="mt-1 text-[11px] font-semibold text-steel">
              Paper is selected by default. Add a node under Settings → Nodes before provisioning.
            </p>
          </div>
          {!nodes.length ? (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-[11px] font-semibold text-ice">
              No nodes are configured.{" "}
              {isAdmin ? (
                <button
                  type="button"
                  className="ml-1 font-extrabold text-accent underline"
                  onClick={() => setView("nodes")}
                >
                  Open node settings
                </button>
              ) : (
                "Ask an administrator to add a node."
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-steel">
                  Server name
                  <input
                    className="panel-input"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    minLength={2}
                    maxLength={40}
                    required
                    placeholder="My Paper server"
                  />
                </label>
                <label className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-steel">
                  Game / software
                  <select
                    className="panel-input"
                    value={newTemplate}
                    onChange={(event) => setNewTemplate(event.target.value)}
                  >
                    {SERVER_TEMPLATES.filter((template) => template.category === "game").map(
                      (template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-steel">
                  Node
                  <select
                    className="panel-input"
                    value={newNode || nodes[0]?.id}
                    onChange={(event) => setNewNode(event.target.value)}
                    required
                  >
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name} · {node.region}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-steel">
                  CPU limit
                  <select
                    className="panel-input"
                    value={newCpu}
                    onChange={(event) => setNewCpu(Number(event.target.value))}
                  >
                    {CPU_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}%
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-steel">
                  Memory
                  <select
                    className="panel-input"
                    value={newMemory}
                    onChange={(event) => setNewMemory(Number(event.target.value))}
                  >
                    {MEMORY_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {formatMb(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-steel">
                  Disk
                  <select
                    className="panel-input"
                    value={newDisk}
                    onChange={(event) => setNewDisk(Number(event.target.value))}
                  >
                    {DISK_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {formatMb(value)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-col justify-between gap-3 border-t border-line pt-3 sm:flex-row sm:items-center">
                <p className="max-w-2xl text-[10px] font-semibold leading-relaxed text-faint">
                  This creates a BT Panel server record. Power, console, metrics and files do not
                  control a real Minecraft process until a Pterodactyl/Wings daemon is connected.
                </p>
                <button
                  type="submit"
                  className="btn-accent min-h-10 shrink-0 px-4"
                  disabled={createPending || !newName.trim()}
                >
                  {createPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {createPending ? "Creating…" : "Create server"}
                </button>
              </div>
            </>
          )}
        </form>
      ) : null}

      <PteroStatGrid>
        <PteroStat
          icon={<ServerIcon className="size-4" />}
          label={t("servers.stat.total")}
          value={String(servers.length)}
          hint={t("servers.stat.totalHint")}
        />
        <PteroStat
          icon={<Activity className="size-4" />}
          label={t("servers.stat.running")}
          value={String(runningCount)}
          hint={t("servers.stat.runningHint")}
        />
        <PteroStat
          icon={<Square className="size-4" />}
          label={t("servers.stat.offline")}
          value={String(offlineCount)}
          hint={t("servers.stat.offlineHint")}
          accent={false}
        />
      </PteroStatGrid>

      <section className="grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <PteroSearch value={query} onChange={setQuery} placeholder={t("servers.search")} />
          <label className="flex items-center gap-2 text-[11px] font-bold text-steel">
            {t("servers.filter.label")}
            <select
              className="panel-input h-10 min-w-32 text-[12px]"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">{t("servers.filter.all")}</option>
              <option value="running">{t("servers.filter.running")}</option>
              <option value="offline">{t("servers.filter.offline")}</option>
            </select>
          </label>
        </div>

        {servers.length === 0 ? (
          <div className="glass">
            <PteroEmpty
              icon={<ServerIcon className="size-5" />}
              title={t("servers.empty.title")}
              body={
                isAdmin && nodes.length === 0
                  ? t("servers.empty.needNode")
                  : t("servers.empty.body")
              }
              action={
                isAdmin && nodes.length === 0 ? (
                  <button type="button" className="btn-accent" onClick={() => setView("nodes")}>
                    {t("servers.empty.openNodes")}
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : visibleServers.length === 0 ? (
          <div className="glass">
            <PteroEmpty
              icon={<ServerIcon className="size-5" />}
              title={t("servers.empty.noMatches")}
              body={t("servers.empty.noMatchesBody")}
            />
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {visibleServers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                pending={pending?.id === server.id ? pending.action : null}
                onPower={power}
                onOpen={() => setSelectedServerId(server.id)}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </PteroPage>
  );
}
function ServerCard({ server, pending, onPower, onOpen, t }) {
  const status =
    server.status === "running" ? "online" : server.status === "offline" ? "offline" : "loading";
  const statusLabel = t(`servers.status.${server.status}`);
  const isBusy = pending !== null || server.status === "starting" || server.status === "stopping";
  return (
    <article className="glass overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-accent/30 bg-accent/10 text-accent">
            <ServerIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-extrabold text-ice">{server.name}</h3>
            <p className="mt-0.5 truncate font-mono text-[10px] font-semibold text-faint">
              {server.id} · {server.template}
            </p>
          </div>
        </div>
        <PteroStatus status={status} label={statusLabel} />
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:px-5">
        <Allocation
          icon={<Cpu className="size-3.5" />}
          label={t("servers.resource.cpu")}
          value={`${server.cpuLimit}%`}
          limitLabel={t("servers.resource.limit")}
        />
        <Allocation
          icon={<Activity className="size-3.5" />}
          label={t("servers.resource.memory")}
          value={formatMb(server.memoryMb)}
          limitLabel={t("servers.resource.limit")}
        />
        <Allocation
          icon={<HardDrive className="size-3.5" />}
          label={t("servers.resource.disk")}
          value={formatMb(server.diskMb)}
          limitLabel={t("servers.resource.limit")}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-line bg-sunken/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0 text-[10.5px] font-semibold text-steel">
          <span className="block truncate">
            <span className="text-faint">{t("servers.address")}</span>{" "}
            <span className="font-mono text-ice">
              {server.ip}:{server.port}
            </span>
          </span>
          <span className="block truncate">
            <span className="text-faint">{t("servers.node")}</span> {server.node}
            {server.ownerName ? ` · ${t("servers.owner")} ${server.ownerName}` : ""}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className="btn-ghost min-h-9 px-3 text-[11px]" onClick={onOpen}>
            <Terminal className="size-3.5" />
            {t("servers.action.open")}
          </button>
          {server.status === "offline" ? (
            <button
              type="button"
              className="btn-accent min-h-9 px-3 text-[11px]"
              disabled={isBusy}
              onClick={() => onPower(server, "start")}
            >
              {pending === "start" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}{" "}
              {t("servers.action.start")}
            </button>
          ) : null}
          {server.status === "running" || server.status === "starting" ? (
            <button
              type="button"
              className="btn-ghost min-h-9 px-3 text-[11px]"
              disabled={isBusy}
              onClick={() => onPower(server, "stop")}
            >
              {pending === "stop" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Square className="size-3.5" />
              )}{" "}
              {t("servers.action.stop")}
            </button>
          ) : null}
          {server.status === "running" ? (
            <button
              type="button"
              className="btn-ghost min-h-9 px-3 text-[11px]"
              disabled={isBusy}
              onClick={() => onPower(server, "restart")}
            >
              {pending === "restart" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}{" "}
              {t("servers.action.restart")}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
function Allocation({ icon, label, value, limitLabel }) {
  return (
    <div className="rounded-[11px] border border-line bg-fill px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[9.5px] font-extrabold tracking-[0.08em] text-steel uppercase">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-[13px] font-extrabold text-ice">{value}</div>
      <div className="text-[9px] font-semibold text-faint">{limitLabel}</div>
    </div>
  );
}
