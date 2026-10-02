"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
export function PteroSearch({ value, onChange, placeholder = "Search" }) {
  return (
    <label className="relative block min-w-[210px]">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="panel-input h-10 pl-9 text-[12px]"
      />
    </label>
  );
}
export function PteroTable({ children, className }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="user-table min-w-full">{children}</table>
    </div>
  );
}
export function PteroEmpty({ icon, title, body, action }) {
  return (
    <div className="grid place-items-center gap-2 px-5 py-12 text-center">
      <div className="grid size-11 place-items-center rounded-[12px] border border-line bg-fill text-steel">
        {icon}
      </div>
      <h3 className="mt-1 text-[14px] font-extrabold text-ice">{title}</h3>
      {body ? <p className="max-w-md text-[11.5px] font-semibold text-steel">{body}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
