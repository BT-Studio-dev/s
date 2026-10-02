"use client";

import { useState } from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { formatMb } from "@/lib/utils";
import { Button, Empty, Field, Input, Panel } from "../ui";

const STATUS_STYLE = {
  ready: "text-ok",
  creating: "text-warn",
  restoring: "text-warn",
  failed: "text-danger",
};

export function BackupsTab({ server, backups, actions, isPending }) {
  const [name, setName] = useState("");

  async function create(event) {
    event.preventDefault();
    const value = name.trim();
    if (!value) return;
    const created = await actions.createBackup(value);
    if (created) setName("");
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Create a backup" description="Snapshots are listed below once complete.">
        <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Backup name" hint="For example: before-1.21-update">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="nightly-full"
                maxLength={60}
              />
            </Field>
          </div>
          <Button type="submit" variant="primary" loading={isPending("backup:create")}>
            Create backup
          </Button>
        </form>
      </Panel>

      <Panel title="Backups" description={`${backups.length} stored for ${server.name}.`}>
        {backups.length === 0 ? (
          <Empty
            icon={Archive}
            title="No backups yet"
            description="Create one above to capture the current world and configuration."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-fill px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold">{backup.name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-steel">
                    {formatMb(backup.sizeMb)} ·{" "}
                    <span className={STATUS_STYLE[backup.status] ?? "text-steel"}>
                      {backup.status}
                    </span>
                    {backup.createdByName ? ` · by ${backup.createdByName}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    onClick={() => actions.restoreBackup(backup.id)}
                    loading={isPending(`backup:restore:${backup.id}`)}
                    disabled={backup.status !== "ready"}
                    title={
                      backup.status === "ready"
                        ? "Restore this backup"
                        : "Only completed backups can be restored"
                    }
                  >
                    <RotateCcw className="size-3.5" />
                    Restore
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => actions.deleteBackup(backup.id)}
                    loading={isPending(`backup:delete:${backup.id}`)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
