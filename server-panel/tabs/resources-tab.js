"use client";

import { Activity, Cpu, HardDrive, Wifi } from "lucide-react";
import { formatMb } from "@/lib/utils";
import { formatRate } from "@/lib/panel/telemetry";
import { Panel, Row } from "../ui";

/** Compact sparkline drawn from the sampled telemetry history. */
function Sparkline({ points, max, accent = "var(--accent)" }) {
  if (points.length < 2) {
    return <div className="h-16 rounded-lg border border-line bg-sunken" />;
  }
  const width = 100;
  const height = 32;
  const ceiling = max || Math.max(...points, 1);
  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - Math.min(value / ceiling, 1) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-16 w-full rounded-lg border border-line bg-sunken"
    >
      <path d={area} fill={accent} opacity="0.12" />
      <path d={path} fill="none" stroke={accent} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Metric({ icon: Icon, label, value, points, max }) {
  return (
    <div className="glass-inset rounded-xl border border-line p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-steel">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className="text-[13px] font-extrabold">{value}</span>
      </div>
      <Sparkline points={points} max={max} />
    </div>
  );
}

export function ResourcesTab({ server, history }) {
  const latest = history.at(-1) ?? { cpu: 0, memMb: 0, diskMb: 0, netIn: 0, netOut: 0 };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Cpu}
          label="CPU"
          value={`${latest.cpu.toFixed(0)}%`}
          points={history.map((point) => point.cpu)}
          max={server.cpuLimit}
        />
        <Metric
          icon={Activity}
          label="Memory"
          value={formatMb(latest.memMb)}
          points={history.map((point) => point.memMb)}
          max={server.memoryMb}
        />
        <Metric
          icon={HardDrive}
          label="Disk"
          value={formatMb(latest.diskMb)}
          points={history.map((point) => point.diskMb)}
          max={server.diskMb}
        />
        <Metric
          icon={Wifi}
          label="Network in"
          value={formatRate(latest.netIn)}
          points={history.map((point) => point.netIn)}
        />
      </div>

      <Panel title="Allocated limits" description="Configured ceilings for this server.">
        <Row label="CPU limit" value={`${server.cpuLimit}%`} />
        <Row label="Memory" value={formatMb(server.memoryMb)} />
        <Row label="Disk" value={formatMb(server.diskMb)} />
        <Row label="Network out" value={formatRate(latest.netOut)} />
      </Panel>
    </div>
  );
}
