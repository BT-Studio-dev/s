"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Globe, Plus, Trash } from "lucide-react";
import type { NodeDto } from "@/lib/panel/types";
import { api } from "@/lib/utils";
import { usePanel } from "../context";
import { Field, Spinner } from "../ui";

/**
 * Node CRUD, shared by the Settings → Nodes tab and the top-level Nodes view so
 * the two can never drift apart.
 */
export function NodesPanel() {
  const { nodes, setNodes, isAdmin, t } = usePanel();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("EU");
  const [subnet, setSubnet] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) {
      toast.error("Give the node a name");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ node: NodeDto }>("/api/nodes", {
        method: "POST",
        body: { name, region, subnet: subnet || undefined },
      });
      setNodes([...nodes, res.node]);
      setName("");
      setSubnet("");
      toast.success(`${res.node.name} added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add that node");
    } finally {
      setBusy(false);
    }
  }

  async function remove(node: NodeDto) {
    setPending(node.id);
    try {
      const res = await api<{ nodes: NodeDto[] }>("/api/nodes", { method: "DELETE", body: { id: node.id } });
      setNodes(res.nodes);
      toast.success(`${node.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove that node");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="glass p-5">
      <h3 className="text-[16px] font-extrabold">Nodes</h3>
      <p className="mt-1 text-[13px] font-semibold text-steel">
        Hosts for panel workloads. New nodes become available in the infrastructure inventory.
      </p>

      {isAdmin ? (
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_140px_1fr_auto] md:items-end">
        <Field label="Name">
          <input
            className="panel-input"
            value={name}
            maxLength={40}
            placeholder="Amsterdam"
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Region">
          <select className="panel-input" value={region} onChange={(e) => setRegion(e.target.value)}>
            {["EU", "US", "APAC", "SA", "AF"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subnet" hint="Optional · prefix for server IPs.">
          <input
            className="panel-input"
            value={subnet}
            maxLength={24}
            placeholder="10.80.0."
            onChange={(e) => setSubnet(e.target.value)}
          />
        </Field>
        <button type="button" className="btn-accent" onClick={() => void add()} disabled={busy}>
          {busy ? <Spinner /> : <Plus className="size-4" />} Add Node
        </button>
        </div>
      ) : (
        <p className="mt-4 text-[12px] font-semibold text-steel">{t("nodes.readOnly")}</p>
      )}

      <div className="mt-5 grid gap-2">
        {nodes.length ? (
          nodes.map((node) => (
            <div key={node.id} className="flex items-center gap-3 rounded-[12px] border border-line bg-fill px-3.5 py-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-[9px] border border-accent/35 bg-accent/12 text-accent">
                <Globe className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-extrabold">
                  {node.name}{" "}
                  <span className="ml-1 font-mono text-[10.5px] font-medium text-steel">{node.id}</span>
                </div>
                <div className="text-[11px] font-semibold text-steel">
                  {node.region} · {node.subnet} · {node.serverCount}{" "}
                  {node.serverCount === 1 ? "server" : "servers"}
                </div>
              </div>
              {isAdmin ? <button
                type="button"
                className="btn-ghost shrink-0 px-2.5 py-1.5 text-[12px] font-bold text-danger hover:border-danger/45 hover:bg-danger/10"
                title={node.serverCount ? "Move or delete its servers first" : `Delete ${node.name}`}
                disabled={pending === node.id}
                onClick={() => void remove(node)}
              >
                {pending === node.id ? <Spinner /> : <Trash className="size-3.5" />} Delete
              </button> : null}
            </div>
          ))
        ) : (
          <p className="rounded-[12px] border border-dashed border-line-strong bg-fill/40 px-3 py-6 text-center text-[12.5px] font-semibold text-steel italic">
            No nodes yet — add one above to provision a workload host.
          </p>
        )}
      </div>
    </div>
  );
}
