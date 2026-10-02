"use client";

import { Globe, Server } from "lucide-react";
import { usePanel } from "../context";

/**
 * Locations are derived, not stored: a region is whatever the nodes that serve
 * it declare. That keeps the two pages in step with no second source of truth
 * and no extra table to fall out of sync.
 */
export function LocationsView() {
  const { nodes, servers } = usePanel();

  const locations = [...nodes.reduce((map, node) => map.set(node.region, (map.get(node.region) ?? 0) + 1), new Map<string, number>())]
    .map(([region, nodeCount]) => {
      const inRegion = nodes.filter((node) => node.region === region);
      const ids = new Set(inRegion.map((node) => node.id));
      const hosted = servers.filter((server) => ids.has(server.node));
      return {
        region,
        nodeCount,
        nodes: inRegion,
        hosted,
        running: hosted.filter((server) => server.status === "running").length,
        subnets: [...new Set(inRegion.map((node) => node.subnet))],
      };
    })
    .sort((a, b) => b.hosted.length - a.hosted.length || a.region.localeCompare(b.region));

  return (
    <div className="view-enter">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight">
          <Globe className="size-5 text-accent" /> Locations
        </h2>
        <p className="mt-1 text-[13px] font-semibold text-steel">
          Regions grouped from your nodes. Add a node under Nodes and its region shows up here automatically.
        </p>
      </div>

      {locations.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <div key={location.region} className="glass p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-[10px] border border-accent/35 bg-accent/12 text-accent">
                    <Globe className="size-4" />
                  </span>
                  <div>
                    <div className="text-[15px] font-extrabold tracking-tight">{location.region}</div>
                    <div className="text-[11px] font-semibold text-steel">
                      {location.nodeCount} {location.nodeCount === 1 ? "node" : "nodes"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[17px] font-extrabold leading-none text-ice">{location.hosted.length}</div>
                  <div className="mt-0.5 text-[10px] font-extrabold tracking-[0.14em] text-faint uppercase">
                    {location.running} up
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                {location.nodes.map((node) => (
                  <div key={node.id} className="flex items-center gap-2 text-[12px]">
                    <Server className="size-3.5 shrink-0 text-steel" />
                    <span className="truncate font-bold text-ice">{node.name}</span>
                    <span className="ml-auto shrink-0 font-mono text-[10.5px] text-faint">{node.subnet}</span>
                  </div>
                ))}
              </div>

              {location.subnets.length ? (
                <p className="mt-3 text-[11px] font-semibold text-faint">
                  Subnets: <span className="font-mono">{location.subnets.join(", ")}</span>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="glass px-4 py-10 text-center text-[13px] font-semibold text-steel italic">
          No locations yet — add a node to describe where your servers run.
        </p>
      )}
    </div>
  );
}
