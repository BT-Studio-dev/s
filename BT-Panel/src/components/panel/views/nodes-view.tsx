"use client";

import { Network } from "lucide-react";
import { usePanel } from "../context";
import { NodesPanel } from "./nodes-panel";

/**
 * Top-level Nodes view. The CRUD itself lives in `NodesPanel` so the
 * Settings → Nodes tab and this page cannot drift apart.
 */
export function NodesView() {
  const { nodes } = usePanel();
  const running = nodes.reduce((total, node) => total + node.serverCount, 0);

  return (
    <div className="view-enter">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight">
            <Network className="size-5 text-accent" /> Nodes
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-steel">
            The compute hosts managed by this panel. Adding a node makes it available to the infrastructure inventory.
          </p>
        </div>
        <div className="flex gap-2">
          <Stat label="Nodes" value={String(nodes.length)} />
          <Stat label="Servers hosted" value={String(running)} />
        </div>
      </div>
      <NodesPanel />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass min-w-[104px] px-3.5 py-2.5 text-center">
      <div className="text-[19px] font-extrabold leading-none text-ice">{value}</div>
      <div className="mt-1 text-[10px] font-extrabold tracking-[0.14em] text-faint uppercase">{label}</div>
    </div>
  );
}
