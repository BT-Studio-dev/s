"use client";

import { useState } from "react";
import { AlertTriangle, Save, Trash2, UserCog } from "lucide-react";
import { Button, Field, Input, Panel, Row } from "../ui";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function SettingsTab({ server, team, isAdmin, actions, isPending, onDeleted }) {
  const [name, setName] = useState(server.name);
  const [ownerId, setOwnerId] = useState(server.ownerId ?? "");
  const [confirm, setConfirm] = useState("");

  const nameChanged = name.trim() !== server.name && name.trim().length >= 2;
  const canDelete = confirm.trim() === server.name;

  async function remove() {
    const done = await actions.destroy();
    if (done) onDeleted?.();
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Server name" description="Shown everywhere in the panel.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Name" hint="2–40 characters.">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
              />
            </Field>
          </div>
          <Button
            variant="primary"
            disabled={!nameChanged}
            loading={isPending("rename")}
            onClick={() => actions.rename(name.trim())}
          >
            <Save className="size-3.5" />
            Save
          </Button>
        </div>
      </Panel>

      <Panel title="Information">
        <Row label="Server ID" value={server.id} mono />
        <Row label="Owner" value={server.ownerName || "Unassigned"} />
        <Row label="Created" value={formatDate(server.createdAt)} />
        <Row label="Status changed" value={formatDate(server.statusChangedAt)} />
      </Panel>

      {isAdmin ? (
        <Panel
          title="Transfer ownership"
          description="Move this server to another panel account."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Owner">
                <select
                  value={ownerId}
                  onChange={(event) => setOwnerId(event.target.value)}
                  className="w-full rounded-xl border border-line bg-sunken px-3 py-2 text-[13px] font-semibold outline-none transition focus:border-[var(--accent)]"
                >
                  <option value="">Unassigned</option>
                  {team.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.username} ({member.role})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Button
              variant="primary"
              loading={isPending("owner")}
              disabled={ownerId === (server.ownerId ?? "")}
              onClick={() => actions.transferOwner(ownerId || null)}
            >
              <UserCog className="size-3.5" />
              Transfer
            </Button>
          </div>
        </Panel>
      ) : null}

      <section className="glass flex flex-col border border-danger/30">
        <header className="border-b border-danger/30 px-5 py-4">
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-danger">
            <AlertTriangle className="size-4" />
            Danger zone
          </h3>
          <p className="mt-0.5 text-[12px] font-semibold text-steel">
            Deleting a server removes its backups, plugins and console history. This cannot be
            undone.
          </p>
        </header>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Type the server name to confirm" hint={server.name}>
              <Input
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder={server.name}
              />
            </Field>
          </div>
          <Button
            variant="danger"
            disabled={!canDelete}
            loading={isPending("delete")}
            onClick={remove}
          >
            <Trash2 className="size-3.5" />
            Delete server
          </Button>
        </div>
      </section>
    </div>
  );
}
