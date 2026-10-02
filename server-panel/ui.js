"use client";

import { LoaderCircle } from "lucide-react";

/** Shared chrome for the server panel tabs, matching the panel's glass style. */

export function Panel({ title, description, actions, children, className = "" }) {
  return (
    <section className={`glass flex flex-col ${className}`}>
      {(title || actions) && (
        <header className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h3 className="text-[15px] font-extrabold">{title}</h3> : null}
            {description ? (
              <p className="mt-0.5 text-[12px] font-semibold text-steel">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Button({
  children,
  onClick,
  variant = "default",
  loading = false,
  disabled = false,
  type = "button",
  title,
}) {
  const variants = {
    default: "border-line bg-fill hover:bg-fill-strong",
    primary: "border-transparent bg-[var(--accent)] text-black hover:brightness-110",
    danger: "border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
    ghost: "border-transparent hover:bg-fill",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
    >
      {loading ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-steel">{label}</span>
      {children}
      {hint ? <span className="text-[11px] font-semibold text-faint">{hint}</span> : null}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-line bg-sunken px-3 py-2 text-[13px] font-semibold outline-none transition focus:border-[var(--accent)]"
    />
  );
}

export function Empty({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-6 py-12 text-center">
      {Icon ? <Icon className="size-6 text-steel" /> : null}
      <p className="text-[13px] font-extrabold">{title}</p>
      {description ? (
        <p className="max-w-sm text-[12px] font-semibold text-steel">{description}</p>
      ) : null}
    </div>
  );
}

export function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-[12px] font-extrabold uppercase tracking-wide text-steel">{label}</span>
      <span className={`text-[13px] font-bold ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
