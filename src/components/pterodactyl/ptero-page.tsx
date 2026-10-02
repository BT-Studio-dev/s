"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PteroPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 pb-2", className)}>{children}</div>;
}

export function PteroPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-[21px] font-extrabold tracking-tight text-ice">{title}</h2>
        {description ? <p className="mt-1 max-w-3xl text-[12.5px] font-semibold text-steel">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PteroPanel({
  title,
  description,
  children,
  actions,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass overflow-hidden", className)}>
      {title || description || actions ? (
        <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? <h3 className="text-[15px] font-extrabold text-ice">{title}</h3> : null}
            {description ? <p className="mt-0.5 text-[11.5px] font-semibold text-steel">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
