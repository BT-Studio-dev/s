"use client";

import { cn } from "@/lib/utils";
export function PteroStatGrid({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
export function PteroStat({ icon, label, value, hint, accent = true }) {
  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10.5px] font-extrabold tracking-[0.13em] text-steel uppercase">
          {label}
        </span>
        {icon ? (
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-[9px] border",
              accent
                ? "border-accent/35 bg-accent/12 text-accent"
                : "border-line bg-fill text-steel",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-[25px] font-extrabold tracking-tight text-ice">{value}</div>
      {hint ? <div className="mt-1.5 text-[11px] font-semibold text-steel">{hint}</div> : null}
    </div>
  );
}
