"use client";

import type { ReactNode } from "react";
import {
  Boxes,
  Globe,
  HardDrive,
  KeyRound,
  Network,
  Settings,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PANEL_VERSION } from "@/lib/panel/types";
import { usePanel } from "../context";
import { PresenceAvatar, Stat } from "../ui";
import {
  PteroEmpty,
  PteroPage,
  PteroPageHeader,
  PteroPanel,
  PteroStat,
  PteroStatGrid,
  PteroStatus,
} from "../../pterodactyl";

export function HomeView() {
  const {
    profile,
    settings,
    userCount,
    isAdmin,
    setView,
    t,
    setSettingsTab,
    team,
    nodes,
  } = usePanel();

  const onlineTeam = team.filter((member) => member.online || member.userId === profile.userId);
  const uniqueRegions = new Set(nodes.map((node) => node.region.trim()).filter(Boolean)).size;

  return (
    <PteroPage>
      <PteroPageHeader
        title={settings.welcomeTitle || "Overview"}
        description={settings.panelSubtitle || "Pterodactyl-style administration workspace"}
        actions={
          <PteroStatus status="online" label="Panel online" />
        }
      />

      <div className="glass px-5 py-4">
        <p className="text-[14px] font-semibold text-steel">
          {settings.welcomeMessage} Hello <strong className="text-ice">{profile.username}</strong>.
          {settings.showRole ? <> You are signed in as <span className="text-ice">{profile.role}</span>.</> : null}
        </p>
      </div>

      <PteroStatGrid>
        {isAdmin ? (
          <PteroStat
            icon={<Users className="size-4" />}
            label="Users"
            value={String(userCount)}
            hint="Accounts registered on this panel"
          />
        ) : (
          <PteroStat
            icon={<ShieldCheck className="size-4" />}
            label="Access"
            value="Member"
            hint="Panel resources available to you"
          />
        )}
        <PteroStat icon={<Network className="size-4" />} label="Nodes" value={String(nodes.length)} hint="Configured compute locations" />
        <PteroStat icon={<Globe className="size-4" />} label="Regions" value={String(uniqueRegions)} hint="Distinct node regions" />
        <PteroStat icon={<Users className="size-4" />} label="Team online" value={`${onlineTeam.length}/${team.length}`} hint="Current panel presence" />
      </PteroStatGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PteroPanel
          title="Administration"
          description="Core resources exposed by BT Panel"
        >
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <ResourceCard icon={<Network className="size-4" />} title="Nodes" body="Configure compute hosts and connection details." onClick={() => setView("nodes")} />
            <ResourceCard icon={<Server className="size-4" />} title={t("nav.servers")} body={t("servers.home.description")} onClick={() => setView("servers")} />
            {isAdmin ? <ResourceCard icon={<Globe className="size-4" />} title="Locations" body="Organize nodes by region and location." onClick={() => setView("locations")} /> : null}
            {isAdmin ? <ResourceCard icon={<Boxes className="size-4" />} title="Nests" body="Manage service templates and eggs." onClick={() => setView("nests")} /> : null}
            {isAdmin ? <ResourceCard icon={<HardDrive className="size-4" />} title="Mounts" body="Manage host storage mounts." onClick={() => setView("mounts")} /> : null}
            {isAdmin ? <ResourceCard icon={<KeyRound className="size-4" />} title="Application API" body="Create and manage API credentials." onClick={() => setView("apikeys")} /> : null}
            {isAdmin ? <ResourceCard icon={<Settings className="size-4" />} title="Settings" body="Configure branding, theme, access and mail." onClick={() => setSettingsTab("general")} /> : null}
          </div>
        </PteroPanel>

        <PteroPanel title="Nodes" description="Current node inventory">
          {nodes.length === 0 ? (
            <PteroEmpty
              icon={<Network className="size-5" />}
              title="No nodes configured"
              body="Add a node to begin building the panel infrastructure inventory."
              action={isAdmin ? <button className="btn-accent" onClick={() => setView("nodes")}>Add Node</button> : null}
            />
          ) : (
            <div className="divide-y divide-line">
              {nodes.slice(0, 8).map((node) => (
                <button
                  type="button"
                  key={node.id}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-fill"
                  onClick={() => setView("nodes")}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-accent/30 bg-accent/10 text-accent">
                    <Network className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-extrabold text-ice">{node.name}</span>
                    <span className="block truncate font-mono text-[10.5px] font-semibold text-steel">{node.region} · {node.subnet}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-[11px] font-extrabold text-ice">{node.serverCount}</span>
                    <span className="text-[9.5px] font-bold tracking-[0.1em] text-steel uppercase">workloads</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </PteroPanel>
      </div>

      <PteroPanel title="Team" description="Recent panel presence" actions={<button type="button" className="text-[12px] font-bold text-accent hover:brightness-125" onClick={() => setView("team")}>Open team</button>}>
        {team.length === 0 ? (
          <PteroEmpty icon={<Users className="size-5" />} title="No team members" />
        ) : (
          <div className="flex flex-wrap gap-2 p-4">
            {team.slice(0, 12).map((member) => (
              <div key={member.userId} className="flex items-center gap-2 rounded-[12px] border border-line bg-fill py-1.5 pr-3 pl-1.5">
                <PresenceAvatar name={member.username} src={member.profilePic} size="sm" online={member.online || member.userId === profile.userId} />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-extrabold text-ice">{member.username}</div>
                  <div className="text-[9.5px] font-bold tracking-[0.12em] text-steel uppercase">{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PteroPanel>

      {isAdmin && settings.showVersion ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Panel Version" value={PANEL_VERSION} mono />
          <Stat label="UI" value="Pterodactyl-style" />
        </div>
      ) : null}
    </PteroPage>
  );
}

function ResourceCard({ icon, title, body, onClick }: { icon: ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group rounded-[13px] border border-line bg-fill p-4 text-left transition-all hover:border-line-strong hover:bg-fill-strong">
      <span className="grid size-9 place-items-center rounded-[10px] border border-accent/30 bg-accent/10 text-accent transition-transform group-hover:scale-105">{icon}</span>
      <span className="mt-3 block text-[13px] font-extrabold text-ice">{title}</span>
      <span className="mt-1 block text-[11px] font-semibold leading-relaxed text-steel">{body}</span>
    </button>
  );
}
