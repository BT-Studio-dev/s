"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { HardDrive, Plus, Trash } from "lucide-react";
import { api } from "@/lib/utils";
import { usePanel } from "../context";
import { Field, Spinner, ToggleRow } from "../ui";
const FSTYPES = ["overlay", "nfs", "cifs", "ext4", "xfs", "zfs", "btrfs"];

/**
 * Mounts are the storage an admin has made allocatable. Capacity here is
 * compared against the sum of the servers' disks rather than trusted on its
 * own, so an over-committed panel is visible instead of silently wrong.
 */
export function MountsView() {
  const { servers } = usePanel();
  const [mounts, setMounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    path: "",
    target: "/mnt",
    readOnly: false,
    userMountable: false,
    fstype: "overlay",
    sizeGb: 100,
  });
  const load = useCallback(async () => {
    try {
      const res = await api("/api/mounts");
      setMounts(res.mounts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load mounts");
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
      toast.error("Give the mount a name");
      return;
    }
    setBusy(true);
    try {
      const res = await api("/api/mounts", {
        method: "POST",
        body: form,
      });
      setMounts((current) => [...current, res.mount]);
      setForm({
        name: "",
        description: "",
        path: "",
        target: "/mnt",
        readOnly: false,
        userMountable: false,
        fstype: "overlay",
        sizeGb: form.sizeGb,
      });
      toast.success(`${res.mount.name} added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add that mount");
    } finally {
      setBusy(false);
    }
  }
  async function remove(mount) {
    setPending(mount.id);
    try {
      const res = await api("/api/mounts", {
        method: "DELETE",
        body: {
          id: mount.id,
        },
      });
      setMounts(res.mounts);
      toast.success(`${mount.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove that mount");
    } finally {
      setPending(null);
    }
  }
  const capacityGb = mounts.reduce((total, mount) => total + mount.sizeGb, 0);
  const usedGb = Math.round(servers.reduce((total, server) => total + server.diskMb, 0) / 1024);
  const overCommitted = usedGb > capacityGb && capacityGb > 0;
  return (
    <div className="view-enter">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight">
            <HardDrive className="size-5 text-accent" /> Mounts
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] font-semibold text-steel">
            Storage you have made allocatable to servers. Capacity is checked against the disks
            servers actually hold, so over-commitment shows up here.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="glass min-w-[104px] px-3.5 py-2.5 text-center">
            <div className="text-[19px] font-extrabold leading-none text-ice">{capacityGb}</div>
            <div className="mt-1 text-[10px] font-extrabold tracking-[0.14em] text-faint uppercase">
              GB free
            </div>
          </div>
          <div
            className={`glass min-w-[104px] px-3.5 py-2.5 text-center ${overCommitted ? "border-danger/50" : ""}`}
          >
            <div
              className={`text-[19px] font-extrabold leading-none ${overCommitted ? "text-danger" : "text-ice"}`}
            >
              {usedGb}
            </div>
            <div className="mt-1 text-[10px] font-extrabold tracking-[0.14em] text-faint uppercase">
              GB used
            </div>
          </div>
        </div>
      </div>

      {overCommitted ? (
        <p className="mb-4 rounded-[12px] border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[12.5px] font-bold text-danger">
          Servers hold {usedGb} GB but only {capacityGb} GB of mounts are configured. Add storage or
          free disk.
        </p>
      ) : null}

      <div className="glass p-5">
        <h3 className="text-[16px] font-extrabold">Add a mount</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            label="Name"
            hint="Unique · 2–64 characters, used to tell this mount from another."
          >
            <input
              className="panel-input"
              value={form.name}
              maxLength={64}
              placeholder="Primary storage"
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          </Field>
          <Field label="Description" hint={`Optional · ${form.description.length}/191 characters.`}>
            <input
              className="panel-input"
              value={form.description}
              maxLength={191}
              placeholder="Bulk storage for build artefacts"
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />
          </Field>
          <Field label="Source" hint="File path on the host system to mount into the server.">
            <input
              className="panel-input font-mono"
              value={form.path}
              maxLength={120}
              placeholder="/mnt/storage"
              onChange={(e) =>
                setForm({
                  ...form,
                  path: e.target.value,
                })
              }
            />
          </Field>
          <Field label="Target" hint="Where the mount is accessible inside the server.">
            <input
              className="panel-input font-mono"
              value={form.target}
              maxLength={120}
              placeholder="/data"
              onChange={(e) =>
                setForm({
                  ...form,
                  target: e.target.value,
                })
              }
            />
          </Field>
          <Field label="Filesystem">
            <select
              className="panel-input"
              value={form.fstype}
              onChange={(e) =>
                setForm({
                  ...form,
                  fstype: e.target.value,
                })
              }
            >
              {FSTYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Size (GB)">
            <input
              className="panel-input"
              type="number"
              min={1}
              max={100000}
              value={form.sizeGb}
              onChange={(e) =>
                setForm({
                  ...form,
                  sizeGb: Number(e.target.value),
                })
              }
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Read only"
            hint="Is the mount read only inside the server?"
            checked={form.readOnly}
            onChange={(v) =>
              setForm({
                ...form,
                readOnly: v,
              })
            }
          />
          <ToggleRow
            label="User mountable"
            hint="Should users be able to mount this themselves?"
            checked={form.userMountable}
            onChange={(v) =>
              setForm({
                ...form,
                userMountable: v,
              })
            }
          />
        </div>
        <button
          type="button"
          className="btn-accent mt-4"
          onClick={() => void add()}
          disabled={busy}
        >
          {busy ? <Spinner /> : <Plus className="size-4" />} Add Mount
        </button>
      </div>

      <div className="mt-4 glass p-5">
        <h3 className="text-[16px] font-extrabold">Configured mounts</h3>
        {loading ? (
          <div className="mt-5 flex justify-center py-8">
            <Spinner className="size-5 text-accent" />
          </div>
        ) : mounts.length ? (
          <div className="mt-4 grid gap-2">
            {mounts.map((mount) => (
              <div
                key={mount.id}
                className="flex items-center gap-3 rounded-[12px] border border-line bg-fill px-3.5 py-2.5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-[9px] border border-accent/35 bg-accent/12 text-accent">
                  <HardDrive className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-extrabold">
                      {mount.name}{" "}
                      <span className="ml-1 font-mono text-[10.5px] font-medium text-steel">
                        {mount.id}
                      </span>
                      {mount.readOnly ? (
                        <span className="ml-1.5 rounded border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-[9.5px] font-extrabold text-warn">
                          READ ONLY
                        </span>
                      ) : null}
                      {mount.userMountable ? (
                        <span className="ml-1.5 rounded border border-ok/40 bg-ok/10 px-1.5 py-0.5 text-[9.5px] font-extrabold text-ok">
                          USER MOUNTABLE
                        </span>
                      ) : null}
                    </div>
                    <div className="truncate font-mono text-[11px] font-semibold text-steel">
                      {mount.path} <span className="text-faint">→</span> {mount.target} ·{" "}
                      {mount.fstype} · {mount.sizeGb} GB
                    </div>
                    {mount.description ? (
                      <div className="truncate text-[11px] font-semibold text-faint">
                        {mount.description}
                      </div>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost shrink-0 px-2.5 py-1.5 text-[12px] font-bold text-danger hover:border-danger/45 hover:bg-danger/10"
                  title={`Delete ${mount.name}`}
                  disabled={pending === mount.id}
                  onClick={() => void remove(mount)}
                >
                  {pending === mount.id ? <Spinner /> : <Trash className="size-3.5" />} Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-[12px] border border-dashed border-line-strong bg-fill/40 px-3 py-6 text-center text-[12.5px] font-semibold text-steel italic">
            No mounts yet — add one above to declare allocatable storage.
          </p>
        )}
      </div>
    </div>
  );
}
