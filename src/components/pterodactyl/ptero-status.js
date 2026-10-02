"use client";

import { CheckCircle2, CircleAlert, CircleX, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
const STATUS = {
  online: {
    label: "Online",
    className: "border-ok/30 bg-ok/10 text-ok",
    icon: CheckCircle2,
  },
  ready: {
    label: "Ready",
    className: "border-ok/30 bg-ok/10 text-ok",
    icon: CheckCircle2,
  },
  warning: {
    label: "Attention",
    className: "border-warn/30 bg-warn/10 text-warn",
    icon: CircleAlert,
  },
  offline: {
    label: "Offline",
    className: "border-danger/30 bg-danger/10 text-danger",
    icon: CircleX,
  },
  loading: {
    label: "Working",
    className: "border-accent/30 bg-accent/10 text-accent",
    icon: LoaderCircle,
  },
};
export function PteroStatus({ status, label }) {
  // Unknown statuses must not crash the page that renders the badge.
  const item = STATUS[status] ?? STATUS.warning;
  const Icon = item.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-extrabold",
        item.className,
      )}
    >
      <Icon className={cn("size-3.5", status === "loading" && "animate-spin")} />
      {label ?? item.label}
    </span>
  );
}
export function PteroProgress({ value, max = 100, label, valueLabel }) {
  const safeMax = Math.max(0, max);
  const safeValue = Math.max(0, Math.min(value, safeMax || 1));
  const percentage = safeMax ? Math.round((safeValue / safeMax) * 100) : 0;
  return (
    <div>
      {label || valueLabel ? (
        <div className="mb-1.5 flex items-center justify-between gap-3 text-[10.5px] font-bold text-steel">
          <span>{label}</span>
          <span className="font-mono text-ice">{valueLabel ?? `${percentage}%`}</span>
        </div>
      ) : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-fill-strong">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
export function PteroStatusDot({ status }) {
  return (
    <span
      aria-label={status}
      className={cn(
        "size-2 rounded-full",
        status === "online" && "bg-ok shadow-[0_0_9px_rgb(var(--ok-rgb)/0.7)]",
        status === "warning" && "bg-warn shadow-[0_0_9px_rgb(var(--warn-rgb)/0.7)]",
        status === "offline" && "bg-danger",
      )}
    />
  );
}
