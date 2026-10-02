"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound } from "lucide-react";
/**
 * The panel's real REST surface, read straight off the route handlers under
 * src/app/api. Documenting the endpoints that actually exist is the point —
 * an Application API page that advertised routes the panel does not serve
 * would be worse than none.
 */
const ENDPOINTS = [
  {
    group: "Authentication",
    items: [
      {
        method: "POST",
        path: "/api/auth/login",
        auth: "none",
        summary: "Sign in and receive a session token",
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        auth: "session",
        summary: "Invalidate the current session",
      },
      {
        method: "POST",
        path: "/api/auth/register",
        auth: "none",
        summary: "Create an account (when registration is open)",
      },
      {
        method: "POST",
        path: "/api/auth/forgot",
        auth: "none",
        summary: "Request a password reset email",
      },
      {
        method: "POST",
        path: "/api/auth/reset",
        auth: "none",
        summary: "Complete a password reset",
      },
      {
        method: "GET",
        path: "/api/auth/google/start",
        auth: "none",
        summary: "Begin the Google sign-in flow",
      },
    ],
  },
  {
    group: "Panel",
    items: [
      {
        method: "GET",
        path: "/api/panel",
        auth: "session",
        summary: "Dashboard payload: team and node inventory",
      },
      {
        method: "GET",
        path: "/api/health",
        auth: "none",
        summary: "Liveness probe",
      },
      {
        method: "GET",
        path: "/api/bootstrap",
        auth: "session",
        summary: "Everything the shell needs for first paint",
      },
    ],
  },
  {
    group: "Administration",
    items: [
      {
        method: "GET",
        path: "/api/settings",
        auth: "admin",
        summary: "Read panel settings",
      },
      {
        method: "PUT",
        path: "/api/settings",
        auth: "admin",
        summary: "Update panel settings",
      },
      {
        method: "GET",
        path: "/api/nodes",
        auth: "session",
        summary: "List nodes",
      },
      {
        method: "POST",
        path: "/api/nodes",
        auth: "admin",
        summary: "Create a node",
      },
      {
        method: "DELETE",
        path: "/api/nodes",
        auth: "admin",
        summary: "Delete a node by id",
      },
      {
        method: "GET",
        path: "/api/users",
        auth: "admin",
        summary: "List users",
      },
      {
        method: "PUT",
        path: "/api/users/:id",
        auth: "admin",
        summary: "Update a user",
      },
      {
        method: "POST",
        path: "/api/media",
        auth: "admin",
        summary: "Upload wallpaper or logo media",
      },
      {
        method: "GET",
        path: "/api/media/:id",
        auth: "session",
        summary: "Read uploaded media",
      },
    ],
  },
];
const METHOD_TONE = {
  GET: "text-ok border-ok/40 bg-ok/10",
  POST: "text-accent border-accent/40 bg-accent/10",
  PUT: "text-warn border-warn/40 bg-warn/10",
  DELETE: "text-danger border-danger/40 bg-danger/10",
};
export function ApplicationApiView() {
  const [copied, setCopied] = useState(null);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      toast.error("Could not copy — select the text instead.");
    }
  }
  return (
    <div className="view-enter">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight">
            <KeyRound className="size-5 text-accent" /> Application API
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] font-semibold text-steel">
            Every endpoint the panel actually serves, grouped by area. Send your session token as{" "}
            <code className="font-mono text-[12px] text-ice">
              Authorization: Bearer &lt;token&gt;
            </code>
            ; the HttpOnly cookie works too for same-origin calls.
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => void copy(origin)}
          title="Copy this panel's base URL"
        >
          {copied === origin ? <Check className="size-4" /> : <Copy className="size-4" />} Base URL
        </button>
      </div>

      <div className="space-y-4">
        {ENDPOINTS.map((group) => (
          <div key={group.group} className="glass overflow-hidden">
            <div className="border-b border-line px-4 py-2.5 text-[11px] font-extrabold tracking-[0.16em] text-faint uppercase">
              {group.group}
            </div>
            <div className="divide-y divide-line">
              {group.items.map((endpoint) => {
                const row = `${endpoint.method} ${endpoint.path}`;
                return (
                  <div
                    key={row}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5"
                  >
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] font-extrabold ${METHOD_TONE[endpoint.method]}`}
                    >
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-[12.5px] text-ice">{endpoint.path}</code>
                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold ${endpoint.auth === "admin" ? "border-accent/40 bg-accent/10 text-accent" : endpoint.auth === "none" ? "border-line bg-fill text-faint" : "border-line bg-fill text-steel"}`}
                    >
                      {endpoint.auth === "none" ? "public" : endpoint.auth}
                    </span>
                    <span className="min-w-0 flex-1 text-[12px] font-semibold text-steel">
                      {endpoint.summary}
                    </span>
                    <button
                      type="button"
                      className="btn-ghost min-h-7 shrink-0 px-2 text-[11px]"
                      onClick={() => void copy(`${endpoint.method} ${origin}${endpoint.path}`)}
                    >
                      {copied === `${endpoint.method} ${origin}${endpoint.path}` ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      Copy
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
