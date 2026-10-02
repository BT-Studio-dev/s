"use client";

import { useState } from "react";
import { copyText } from "@/lib/utils";
import { Check, Copy, Network } from "lucide-react";
import { Button, Panel, Row } from "../ui";

export function NetworkTab({ server }) {
  const [copied, setCopied] = useState(false);
  const address = `${server.ip}:${server.port}`;

  async function copy() {
    const ok = await copyText(address);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="Primary allocation"
        description="The address players connect to."
        actions={
          <Button onClick={copy}>
            {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy address"}
          </Button>
        }
      >
        <div className="flex items-center gap-3 rounded-xl border border-line bg-sunken px-4 py-4">
          <Network className="size-5 text-[var(--accent)]" />
          <span className="font-mono text-[18px] font-extrabold">{address}</span>
        </div>
      </Panel>

      <Panel title="Details">
        <Row label="IP address" value={server.ip} mono />
        <Row label="Port" value={String(server.port)} mono />
        <Row label="Node" value={server.node} mono />
        <Row label="Template" value={server.template} />
      </Panel>
    </div>
  );
}
