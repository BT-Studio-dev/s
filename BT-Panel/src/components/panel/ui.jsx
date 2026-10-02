"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  CodeXml,
  Crosshair,
  Flame,
  Hexagon,
  LoaderCircle,
  Pickaxe,
  Swords,
  X,
} from "lucide-react";
import { getTemplate } from "@/lib/panel/catalog";
import { clamp, cn } from "@/lib/utils";
export function BrandMark({ className = "size-8", src }) {
  return <img src={src || "/brand-mark.svg"} alt="" className={className} />;
}
export function PresenceAvatar({ name, src, size = "md", online }) {
  const dim = size === "lg" ? "size-24" : size === "sm" ? "size-9" : "size-10";
  const image = src && src.length > 0 ? src : "/avatar.svg";
  return (
    <div className={cn("relative shrink-0 overflow-hidden", dim)} title={name}>
      <div
        className={cn(
          "grid size-full place-items-center overflow-hidden rounded-[12px] bg-fill-strong",
          size === "lg" && "rounded-[22px]",
        )}
      >
        <img src={image} alt="" className="block size-full object-cover" aria-hidden="true" />
      </div>
      {online !== undefined ? (
        <span
          className={cn("presence-dot", online && "on", size === "lg" && "right-1 bottom-1 size-4")}
        />
      ) : null}
    </div>
  );
}

/** Client-only ticking clock — null during SSR/first paint (no hydration drift). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
const ICONS = {
  pickaxe: Pickaxe,
  flame: Flame,
  crosshair: Crosshair,
  swords: Swords,
  hexagon: Hexagon,
  bot: Bot,
  code: CodeXml,
};
export function TemplateBadge({ templateId, size = "md" }) {
  const t = getTemplate(templateId);
  const Icon = ICONS[t.icon];
  const dim =
    size === "lg"
      ? "size-14 rounded-[16px]"
      : size === "sm"
        ? "size-8 rounded-[9px]"
        : "size-11 rounded-[12px]";
  return (
    <div
      className={cn("grid shrink-0 place-items-center border", dim)}
      style={{
        background: `color-mix(in srgb, ${t.color} 20%, transparent)`,
        borderColor: `color-mix(in srgb, ${t.color} 45%, transparent)`,
        color: t.color,
        boxShadow: `0 0 18px color-mix(in srgb, ${t.color} 22%, transparent)`,
      }}
    >
      <Icon className={size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5"} />
    </div>
  );
}
const STATUS_LABEL = {
  running: "Running",
  offline: "Offline",
  starting: "Starting",
  stopping: "Stopping",
};
export function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-extrabold tracking-[0.08em] uppercase",
        status === "running"
          ? "border-ok/30 bg-ok/10 text-ok"
          : status === "offline"
            ? "border-line bg-fill text-steel"
            : "border-warn/30 bg-warn/10 text-warn",
      )}
    >
      <span className={cn("status-dot", status)} />
      {STATUS_LABEL[status]}
    </span>
  );
}
export function Meter({ value, max, className }) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div className={cn("meter", pct > 90 ? "hot" : pct > 75 ? "warn" : "", className)}>
      <span
        style={{
          width: `${pct}%`,
        }}
      />
    </div>
  );
}
export function Stat({ label, value, accent, link, mono, hint }) {
  return (
    <div className="glass-soft h-full rounded-[calc(var(--panel-radius)-6px)] border border-line px-4 py-4 transition-colors hover:border-line-strong">
      <div className="text-[11px] font-extrabold tracking-[0.12em] text-steel uppercase">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 flex items-center gap-1 text-[20px] font-extrabold",
          accent && "text-accent",
          link && "text-[15px] text-ice",
          mono && "font-mono text-[16px]",
        )}
      >
        {value}
        {link ? <ArrowUpRight className="size-4 text-steel" /> : null}
      </div>
      {hint ? <div className="mt-1 text-[11.5px] font-semibold text-steel">{hint}</div> : null}
    </div>
  );
}
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="switch"
      onClick={() => onChange(!checked)}
    />
  );
}
export function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[12px] border border-line bg-fill px-4 py-3">
      <div className="min-w-0">
        <div className="text-[13.5px] font-extrabold">{label}</div>
        {hint ? <div className="mt-0.5 text-[12px] font-semibold text-steel">{hint}</div> : null}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
export function Slider({ label, value, min = 0, max, suffix, hint, onChange }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12.5px] font-bold text-ice">{label}</span>
        <span className="rounded-md border border-line bg-sunken px-2 py-0.5 font-mono text-[11.5px] font-semibold text-accent">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        className="range-input mt-2"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? (
        <span className="mt-1 block text-[11px] font-semibold text-steel">{hint}</span>
      ) : null}
    </label>
  );
}
export function ColorField({ label, value, hint, onChange }) {
  // The text field is keyed by the external value so a parent-driven change
  // (e.g. the picker) resets the input instead of fighting the user's keystroke.
  // While typing, the local copy lets the user enter "#abc" before it is valid.
  const [text, setText] = useState(value);
  const [dirty, setDirty] = useState(false);
  return (
    <div>
      <div className="text-[12.5px] font-bold text-ice">{label}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <label
          className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-[10px] border border-line-strong"
          style={{
            background: value,
          }}
        >
          <input
            type="color"
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
            onChange={(e) => {
              onChange(e.target.value);
              setDirty(false);
            }}
            aria-label={label}
          />
        </label>
        <input
          key={dirty ? undefined : value}
          className="panel-input font-mono uppercase"
          value={text}
          maxLength={7}
          onFocus={() => setDirty(true)}
          onChange={(e) => {
            setText(e.target.value);
            if (/^#[0-9a-f]{6}$/i.test(e.target.value)) {
              setDirty(false);
              onChange(e.target.value.toLowerCase());
            }
          }}
        />
      </div>
      {hint ? (
        <span className="mt-1 block text-[11px] font-semibold text-steel">{hint}</span>
      ) : null}
    </div>
  );
}
export function Field({ label, hint, children, className }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[12px] font-bold text-steel">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] font-semibold text-faint">{hint}</span>
      ) : null}
    </label>
  );
}
export function Spinner({ className }) {
  return <LoaderCircle className={cn("size-4 animate-spin", className)} />;
}
export function SectionCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}) {
  return (
    <section className={cn("glass overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? <span className="text-accent">{icon}</span> : null}
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-extrabold">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-[12px] font-semibold text-steel">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
export function Modal({ open, onClose, title, subtitle, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid overflow-y-auto bg-black/85 p-4 [place-items:center]"
      onMouseDown={onClose}
    >
      <div
        className={cn(
          "glass-modal view-enter relative flex w-full flex-col overflow-hidden",
          wide ? "max-w-3xl" : "max-w-lg",
          "max-h-[calc(100dvh-2rem)]",
        )}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-extrabold">{title}</h3>
            {subtitle ? (
              <p className="mt-0.5 text-[12px] font-semibold text-steel">{subtitle}</p>
            ) : null}
          </div>
          <button type="button" className="icon-btn size-8" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border border-accent/40 bg-accent/15 text-accent shadow-[0_0_22px_var(--accent-glow)]">
        {icon}
      </div>
      <div className="mt-4 text-[15px] font-extrabold">{title}</div>
      <p className="mt-1 max-w-sm text-[12.5px] font-semibold text-steel">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
