"use client";

import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  LoaderCircle,
  Network,
  Play,
  Plug,
  RotateCcw,
  Archive,
  Settings,
  Square,
  Terminal,
  Zap,
} from "lucide-react";
import { PteroStatus } from "@/components/pterodactyl";
import { formatMb } from "@/lib/utils";
import { usePanel } from "@/components/panel/context";
import { useServerPanel } from "./use-server-panel";
import { Button } from "./ui";
import { ConsoleTab } from "./tabs/console-tab";
import { ResourcesTab } from "./tabs/resources-tab";
import { BackupsTab } from "./tabs/backups-tab";
import { PluginsTab } from "./tabs/plugins-tab";
import { NetworkTab } from "./tabs/network-tab";
import { SettingsTab } from "./tabs/settings-tab";

/** Server lifecycle state -> PteroStatus badge vocabulary. */
const STATUS_BADGE = {
  running: "online",
  offline: "offline",
  starting: "loading",
  stopping: "loading",
  installing: "loading",
  restoring: "loading",
};

const STATUS_LABEL = {
  running: "Running",
  offline: "Offline",
  starting: "Starting",
  stopping: "Stopping",
  installing: "Installing",
  restoring: "Restoring",
};

const TABS = [
  { id: "console", label: "Console", icon: Terminal },
  { id: "resources", label: "Resources", icon: Activity },
  { id: "backups", label: "Backups", icon: Archive },
  { id: "plugins", label: "Plugins", icon: Plug },
  { id: "network", label: "Network", icon: Network },
  { id: "settings", label: "Settings", icon: Settings },
];

/**
 * The per-server control panel: one header with power controls and a set of
 * tabs. It is rendered by /server/<id> and by the servers list when a server
 * is opened, so both entry points share exactly the same screen.
 */
export function ServerPanel({ server: initialServer, onBack }) {
  const { upsertServer, team, isAdmin } = usePanel();
  const [tab, setTab] = useState("console");

  const { server, events, backups, plugins, history, loading, isPending, actions } = useServerPanel(
    initialServer,
    { onServerChange: upsertServer },
  );

  const running = server.status === "running";
  const transitioning = server.status === "starting" || server.status === "stopping";

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Header */}
      <div className="glass flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <Button variant="ghost" onClick={onBack} title="Back to servers">
              <ArrowLeft className="size-4" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[18px] font-extrabold">{server.name}</h2>
              <PteroStatus
                status={STATUS_BADGE[server.status] ?? "warning"}
                label={STATUS_LABEL[server.status] ?? server.status}
              />
              {loading ? <LoaderCircle className="size-3.5 animate-spin text-steel" /> : null}
            </div>
            <p className="mt-0.5 truncate font-mono text-[12px] font-semibold text-steel">
              {server.ip}:{server.port} · {server.node} · {formatMb(server.memoryMb)} ·{" "}
              {server.cpuLimit}% CPU
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={() => actions.power("start")}
            loading={isPending("power:start")}
            disabled={running || transitioning}
          >
            <Play className="size-3.5" />
            Start
          </Button>
          <Button
            onClick={() => actions.power("restart")}
            loading={isPending("power:restart")}
            disabled={!running}
          >
            <RotateCcw className="size-3.5" />
            Restart
          </Button>
          <Button
            onClick={() => actions.power("stop")}
            loading={isPending("power:stop")}
            disabled={!running}
          >
            <Square className="size-3.5" />
            Stop
          </Button>
          <Button
            variant="danger"
            onClick={() => actions.power("kill")}
            loading={isPending("power:kill")}
            disabled={server.status === "offline"}
            title="Force stop the process"
          >
            <Zap className="size-3.5" />
            Kill
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="glass scrollbar-thin flex gap-1 overflow-x-auto p-1.5">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition ${
                active ? "bg-[var(--accent)] text-black" : "text-steel hover:bg-fill hover:text-ice"
              }`}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Body */}
      <div key={tab} className="view-enter">
        {tab === "console" ? (
          <ConsoleTab
            server={server}
            events={events}
            onCommand={actions.sendCommand}
            isPending={isPending}
          />
        ) : null}
        {tab === "resources" ? <ResourcesTab server={server} history={history} /> : null}
        {tab === "backups" ? (
          <BackupsTab server={server} backups={backups} actions={actions} isPending={isPending} />
        ) : null}
        {tab === "plugins" ? (
          <PluginsTab server={server} plugins={plugins} actions={actions} isPending={isPending} />
        ) : null}
        {tab === "network" ? <NetworkTab server={server} /> : null}
        {tab === "settings" ? (
          <SettingsTab
            server={server}
            team={team}
            isAdmin={isAdmin}
            actions={actions}
            isPending={isPending}
            onDeleted={onBack}
          />
        ) : null}
      </div>
    </div>
  );
}
