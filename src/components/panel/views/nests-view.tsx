"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Boxes, Check, Plus, Trash } from "lucide-react";
import { SERVER_TEMPLATES, getTemplate } from "@/lib/panel/catalog";
import type { NestDto } from "@/lib/panel/types";
import { api } from "@/lib/utils";
import { usePanel } from "../context";
import { Field, Spinner } from "../ui";

/**
 * Nests group the services an admin is willing to offer. The egg is picked from
 * SERVER_TEMPLATES, so every option here is something the panel can actually
 * start — a free-text service name would create nests that fail on first use.
 */
export function NestsView() {
  const { servers } = usePanel();
  const [nests, setNests] = useState<NestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", egg: SERVER_TEMPLATES[0].id });

  const load = useCallback(async () => {
    try {
      const res = await api<{ nests: NestDto[] }>("/api/nests");
      setNests(res.nests);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load nests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Mirrors the servers-view fetch effect: the async call is wrapped so the
    // setState it performs is not part of the effect body, and `active` drops
    // a response that lands after unmount.
    let active = true;
    void (async () => {
      if (!active) return;
      await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  async function add() {
    if (!form.name.trim()) {
      toast.error("Give the nest a name");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ nest: NestDto }>("/api/nests", { method: "POST", body: form });
      setNests((current) => [...current, res.nest]);
      setForm({ name: "", description: "", egg: form.egg });
      toast.success(`${res.nest.name} added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add that nest");
    } finally {
      setBusy(false);
    }
  }

  async function remove(nest: NestDto) {
    setPending(nest.id);
    try {
      const res = await api<{ nests: NestDto[] }>("/api/nests", { method: "DELETE", body: { id: nest.id } });
      setNests(res.nests);
      toast.success(`${nest.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove that nest");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="view-enter">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight">
            <Boxes className="size-5 text-accent" /> Nests
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] font-semibold text-steel">
            Named groups of the services this panel offers. Each nest carries one service definition, so the list
            always matches the services this panel can provision.
          </p>
        </div>
        <div className="glass px-4 py-2.5 text-center">
          <div className="text-[19px] font-extrabold leading-none text-ice">{nests.length}</div>
          <div className="mt-1 text-[10px] font-extrabold tracking-[0.14em] text-faint uppercase">Nests</div>
        </div>
      </div>

      <div className="glass p-5">
        <h3 className="text-[16px] font-extrabold">Add a nest</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.4fr_1fr_auto] md:items-end">
          <Field label="Name" hint="Shown in the admin nest list.">
            <input
              className="panel-input"
              value={form.name}
              maxLength={40}
              placeholder="Game services"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <input
              className="panel-input"
              value={form.description}
              maxLength={200}
              placeholder="Competitive and survival worlds"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Service" hint="Only services the panel can run.">
            <select
              className="panel-input"
              value={form.egg}
              onChange={(e) => setForm({ ...form, egg: e.target.value })}
            >
              {SERVER_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <button type="button" className="btn-accent" onClick={() => void add()} disabled={busy}>
            {busy ? <Spinner /> : <Plus className="size-4" />} Add Nest
          </button>
        </div>
      </div>

      <div className="mt-4 glass p-5">
        <h3 className="text-[16px] font-extrabold">Configured nests</h3>
        {loading ? (
          <div className="mt-5 flex justify-center py-8">
            <Spinner className="size-5 text-accent" />
          </div>
        ) : nests.length ? (
          <div className="mt-4 grid gap-2">
            {nests.map((nest) => {
              const template = getTemplate(nest.egg);
              const using = servers.filter((server) => server.template === nest.egg).length;
              return (
                <div
                  key={nest.id}
                  className="flex items-center gap-3 rounded-[12px] border border-line bg-fill px-3.5 py-2.5"
                >
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-[9px] border text-[11px] font-extrabold"
                    style={{ borderColor: `${template.color}59`, background: `${template.color}1f`, color: template.color }}
                  >
                    {template.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-extrabold">
                      {nest.name}{" "}
                      <span className="ml-1 font-mono text-[10.5px] font-medium text-steel">{nest.id}</span>
                    </div>
                    <div className="truncate text-[11px] font-semibold text-steel">
                      {template.name} · {using} {using === 1 ? "server" : "servers"}
                      {nest.description ? ` · ${nest.description}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost shrink-0 px-2.5 py-1.5 text-[12px] font-bold text-danger hover:border-danger/45 hover:bg-danger/10"
                    title={`Delete ${nest.name}`}
                    disabled={pending === nest.id}
                    onClick={() => void remove(nest)}
                  >
                    {pending === nest.id ? <Spinner /> : <Trash className="size-3.5" />} Delete
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-[12px] border border-dashed border-line-strong bg-fill/40 px-3 py-6 text-center text-[12.5px] font-semibold text-steel italic">
            No nests yet — add one above to group the services you offer.
          </p>
        )}
      </div>
    </div>
  );
}
