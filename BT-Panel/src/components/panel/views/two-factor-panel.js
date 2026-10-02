"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { api, copyText } from "@/lib/utils";
import { Spinner } from "../ui";

/**
 * TOTP enrolment. Two steps on purpose: the server issues a secret, the user
 * scans it, and only a code generated from that secret enables 2FA. A user can
 * therefore never end up locked out by a secret their app never received.
 */
export function TwoFactorPanel() {
  const [enabled, setEnabled] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const load = useCallback(async () => {
    try {
      const res = await api("/api/account/totp");
      setEnabled(res.enabled);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read your 2FA status");
    }
  }, []);
  useEffect(() => {
    let active = true;
    void (async () => {
      if (!active) return;
      await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);
  async function begin() {
    setBusy(true);
    try {
      const res = await api("/api/account/totp", {
        method: "POST",
        body: {},
      });
      setSecret(res.secret);
      setUri(res.uri);
      setCode("");
      setEnrolling(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start enrolment");
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    setBusy(true);
    try {
      await api("/api/account/totp", {
        method: "POST",
        body: {
          action: "confirm",
          code,
        },
      });
      setEnabled(true);
      setEnrolling(false);
      setSecret("");
      setCode("");
      toast.success("Two-factor authentication is on.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That code was not accepted");
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    setBusy(true);
    try {
      await api("/api/account/totp", {
        method: "POST",
        body: {
          action: "disable",
        },
      });
      setEnabled(false);
      toast.success("Two-factor authentication is off.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not turn 2FA off");
    } finally {
      setBusy(false);
    }
  }
  async function copySecret() {
    if (await copyText(secret)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } else {
      toast.error("Could not copy — type the key in by hand instead.");
    }
  }
  if (enabled === null) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="size-5 text-accent" />
      </div>
    );
  }
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
            {enabled ? (
              <ShieldCheck className="size-4 text-ok" />
            ) : (
              <ShieldOff className="size-4 text-accent" />
            )}
            Two-factor authentication
          </h3>
          <p className="mt-1 max-w-xl text-[13px] font-semibold text-steel">
            {enabled
              ? "A 6-digit code from your authenticator app is required at every sign-in."
              : "Add a time-based code from an authenticator app so a stolen password alone cannot reach your account."}
          </p>
        </div>
        {enabled ? (
          <button
            type="button"
            className="btn-ghost shrink-0 text-danger hover:border-danger/45"
            disabled={busy}
            onClick={() => void disable()}
          >
            {busy ? <Spinner /> : <ShieldOff className="size-4" />} Turn off
          </button>
        ) : (
          <button
            type="button"
            className="btn-accent shrink-0"
            disabled={busy}
            onClick={() => void begin()}
          >
            {busy ? <Spinner /> : <KeyRound className="size-4" />} Set up
          </button>
        )}
      </div>

      {enrolling && !enabled ? (
        <div className="mt-5 rounded-[12px] border border-line bg-fill p-4">
          <ol className="space-y-3 text-[12.5px] font-semibold text-steel">
            <li className="flex gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-extrabold text-white">
                1
              </span>
              <span>
                In Google Authenticator, Aegis or 1Password, add a new TOTP entry and enter this
                key:
                <button
                  type="button"
                  className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-line bg-sunken px-2 py-1 font-mono text-[11.5px] text-ice"
                  onClick={() => void copySecret()}
                >
                  {secret}
                  {copied ? <Check className="size-3 text-ok" /> : <Copy className="size-3" />}
                </button>
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-extrabold text-white">
                2
              </span>
              <span className="flex-1">
                Enter the 6-digit code your app is showing.
                <input
                  className="panel-input mt-2 max-w-[180px] font-mono text-[16px] tracking-[0.3em]"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  placeholder="000000"
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </span>
            </li>
          </ol>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn-accent"
              disabled={busy || code.length !== 6}
              onClick={() => void confirm()}
            >
              {busy ? <Spinner /> : <ShieldCheck className="size-4" />} Verify and turn on
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEnrolling(false)}>
              Cancel
            </button>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] font-semibold text-faint">
            <Smartphone className="mt-px size-3.5 shrink-0" />
            Nothing is enabled until step 2 succeeds, so you cannot lock yourself out here.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] font-semibold text-faint">
              Cannot scan? Use this otpauth link
            </summary>
            <code className="mt-1.5 block break-all font-mono text-[10.5px] text-steel">{uri}</code>
          </details>
        </div>
      ) : null}
    </>
  );
}
