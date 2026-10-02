"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, LogIn, Mail, RotateCcw, Sparkles, UserPlus } from "lucide-react";
import { applyTheme, getLocalModeOverride } from "@/lib/panel/theme";
import { api, storeToken } from "@/lib/utils";
import { BrandMark, Spinner } from "@/components/panel/ui";
import { WallpaperLayer } from "@/components/panel/wallpaper-layer";
export function AuthShell({ theme, panelName, panelLogo, title, subtitle, children }) {
  useEffect(() => {
    const local = getLocalModeOverride();
    if (local) applyTheme(theme, local);
  }, [theme]);
  const heading = title.replaceAll("{panel}", panelName || "BT Panel");
  return (
    <div className="relative min-h-dvh">
      <WallpaperLayer theme={theme} />
      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        <div className="glass glass-strong view-enter w-full max-w-[380px] px-8 py-8 text-center">
          <div className="mb-5 flex flex-col items-center gap-3">
            <BrandMark
              className="size-12 drop-shadow-[0_0_18px_var(--accent-glow)]"
              src={panelLogo || undefined}
            />
            <div>
              <h1 className="text-[21px] font-extrabold tracking-tight text-ice">{heading}</h1>
              {subtitle ? (
                <p className="mt-1 text-[12.5px] font-semibold text-steel">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
function PasswordInput({ id, value, onChange, autoComplete, placeholder = "••••••••" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        className="panel-input pr-12"
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="absolute top-1/2 right-3 -translate-y-1/2 text-steel transition-colors hover:text-ice"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((v) => !v)}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
function ErrorNote({ message }) {
  if (!message) return null;
  return (
    <p
      className="mt-3 rounded-[10px] border border-danger/35 bg-danger/10 px-3 py-2 text-[12px] font-bold text-danger"
      role="alert"
    >
      {message}
    </p>
  );
}
const labelCls = "mb-1.5 block text-[11px] font-bold tracking-wide text-steel";

/** Focus the first field — but only top-level: browsers refuse (and log an error for) autofocus inside cross-origin iframes such as embedded previews. */
function useTopLevelFocus() {
  const ref = useRef(null);
  useEffect(() => {
    let embedded = true;
    try {
      embedded = window.self !== window.top;
    } catch {
      embedded = true;
    }
    if (!embedded) ref.current?.focus();
  }, []);
  return ref;
}
const linkCls =
  "font-bold text-ice underline decoration-line-strong underline-offset-4 hover:decoration-current";
export function LoginForm({ allowRegistration, demos, google, onAuthenticated }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const firstField = useTopLevelFocus();
  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api("/api/auth/login", {
        body: {
          identifier,
          password,
          code: code || undefined,
        },
      });
      storeToken(res.token);
      // Hand the dashboard straight over — no page navigation, so the panel
      // can never be left hanging between sign-in and home.
      onAuthenticated(res.panel ?? (await api("/api/bootstrap")));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid username or email, or wrong password.";
      // The server says which factor failed; reveal the code box on a TOTP
      // complaint rather than making the user guess.
      if (/two-factor code/i.test(message)) {
        setNeedsCode(true);
        setCode("");
      }
      setError(message);
      setBusy(false);
    }
  }
  const googleReady = !!(google.googleOauthEnabled && google.googleClientId);
  const googleError =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("google_error")
      : null;
  return (
    <>
      <form onSubmit={onSubmit} className="text-left">
        <label className={`mt-1 ${labelCls}`} htmlFor="user">
          Username or Email
        </label>
        <input
          id="user"
          ref={firstField}
          className="panel-input"
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="admin or you@example.com"
          autoComplete="username"
          required
        />
        <div className="mt-3.5 mb-1.5 flex items-center justify-between">
          <label className="block text-[11px] font-bold tracking-wide text-steel" htmlFor="pass">
            Password
          </label>
          <Link href="/forgot" className="text-[11px] font-bold text-accent hover:brightness-125">
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="pass"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        {needsCode ? (
          <div className="mt-3.5">
            <label
              className="mb-1.5 block text-[11px] font-bold tracking-wide text-steel"
              htmlFor="totp"
            >
              Two-factor code
            </label>
            <input
              id="totp"
              className="panel-input font-mono text-[16px] tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              placeholder="000000"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        ) : null}
        <ErrorNote message={error} />
        <button type="submit" className="btn-accent mt-5 w-full" disabled={busy}>
          {busy ? <Spinner /> : <LogIn className="size-4" />} Sign In
        </button>
      </form>
      {googleReady ? (
        <>
          <Divider>or</Divider>
          <a
            href="/api/auth/google/start"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-line-strong bg-fill px-4 py-2.5 text-[13.5px] font-bold text-ice transition-colors hover:border-accent/55 hover:bg-fill-strong"
          >
            <GoogleG className="size-4" />
            Continue with Google
          </a>
        </>
      ) : null}
      {googleError ? (
        <p
          className="mt-3 rounded-[10px] border border-danger/35 bg-danger/10 px-3 py-2 text-[12px] font-bold text-danger"
          role="alert"
        >
          Google sign-in failed: {googleError}
        </p>
      ) : null}
      {demos.length ? (
        <div className="mt-4 rounded-[12px] border border-accent/35 bg-accent/10 px-3 py-3 text-left">
          <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.12em] text-accent uppercase">
            <Sparkles className="size-3.5" /> Demo access
          </div>
          <div className="mt-1.5 grid gap-1.5">
            {demos.map((account) => (
              <button
                key={account.username}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-[9px] border border-line bg-fill px-2.5 py-1.5 text-left transition-colors hover:border-accent/50"
                onClick={() => {
                  setIdentifier(account.username);
                  setPassword(account.password);
                  setError("");
                }}
              >
                <span className="font-mono text-[12.5px] text-ice">
                  {account.username} / {account.password}
                </span>
                <span className="shrink-0 text-[10px] font-extrabold tracking-[0.12em] text-steel uppercase">
                  {account.label} · fill
                </span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-steel">
            Click a row to fill in its credentials.
          </p>
        </div>
      ) : null}
      {allowRegistration ? (
        <div className="mt-5 border-t border-line pt-4 text-[12.5px] font-semibold text-steel">
          Don&apos;t have an account?{" "}
          <Link href="/register" className={linkCls}>
            Create Account
          </Link>
        </div>
      ) : null}
    </>
  );
}

/** A tiny "or" separator used between the password form and the Google button. */
function Divider({ children }) {
  return (
    <div className="mt-4 flex items-center gap-3 text-[10.5px] font-extrabold tracking-[0.14em] text-faint uppercase">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Inline "G" Google logo — keeps the bundle free of an extra image asset. */
function GoogleG({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5c-2 1.5-4.6 2.4-7.5 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5c-.4.4 6.8-5 6.8-14.5 0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
export function RegisterForm({ onAuthenticated }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const firstField = useTopLevelFocus();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const res = await api("/api/auth/register", {
        body: {
          username: form.username,
          email: form.email,
          password: form.password,
        },
      });
      storeToken(res.token);
      onAuthenticated(res.panel ?? (await api("/api/bootstrap")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
      setBusy(false);
    }
  }
  return (
    <>
      <form onSubmit={onSubmit} className="grid gap-3.5 text-left">
        <div>
          <label className={labelCls} htmlFor="reg-user">
            Username
          </label>
          <input
            id="reg-user"
            ref={firstField}
            className="panel-input"
            value={form.username}
            onChange={(e) =>
              setForm({
                ...form,
                username: e.target.value,
              })
            }
            placeholder="steve"
            autoComplete="username"
            maxLength={24}
            required
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            className="panel-input"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="reg-pass">
            Password
          </label>
          <PasswordInput
            id="reg-pass"
            value={form.password}
            onChange={(v) =>
              setForm({
                ...form,
                password: v,
              })
            }
            autoComplete="new-password"
            placeholder="8+ characters"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="reg-confirm">
            Confirm password
          </label>
          <PasswordInput
            id="reg-confirm"
            value={form.confirm}
            onChange={(v) =>
              setForm({
                ...form,
                confirm: v,
              })
            }
            autoComplete="new-password"
          />
        </div>
        <ErrorNote message={error} />
        <button type="submit" className="btn-accent mt-2 w-full" disabled={busy}>
          {busy ? <Spinner /> : <UserPlus className="size-4" />} Create Account
        </button>
      </form>
      <div className="mt-5 border-t border-line pt-4 text-[12.5px] font-semibold text-steel">
        Already have an account?{" "}
        <Link href="/login" className={linkCls}>
          Sign In
        </Link>
      </div>
    </>
  );
}
export function RegistrationClosed() {
  return (
    <>
      <p className="text-[13px] font-semibold text-steel">
        Registration is closed on this panel. Ask an administrator to create an account for you.
      </p>
      <div className="mt-5 border-t border-line pt-4 text-[12.5px] font-semibold text-steel">
        <Link href="/login" className={linkCls}>
          Back to Sign In
        </Link>
      </div>
    </>
  );
}
export function ForgotForm({ panelName, enabled }) {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const firstField = useTopLevelFocus();
  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setPreviewUrl("");
    setBusy(true);
    try {
      const res = await api("/api/auth/forgot", {
        body: {
          identifier,
        },
      });
      setInfo(res.message);
      if (res.previewUrl) setPreviewUrl(res.previewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the reset.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {!enabled ? (
        <p className="mb-4 rounded-[12px] border border-warn/35 bg-warn/10 px-3 py-2 text-left text-[12.5px] font-semibold text-warn">
          Self-service password reset is currently disabled by the panel administrator. Ask an admin
          to reset your password.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="text-left">
        <label className={`mt-1 ${labelCls}`} htmlFor="forgot-id">
          Email
        </label>
        <input
          id="forgot-id"
          ref={firstField}
          className="panel-input"
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@gmail.com"
          autoComplete="email"
          required
        />
        <ErrorNote message={error} />
        <button type="submit" className="btn-accent mt-5 w-full" disabled={busy || !enabled}>
          {busy ? <Spinner /> : <Mail className="size-4" />} Send reset link
        </button>
      </form>
      {info ? (
        <div className="mt-4 rounded-[12px] border border-ok/30 bg-ok/10 px-3 py-3 text-left text-[12px] font-semibold text-ok">
          {info}
          {previewUrl ? (
            <div className="mt-2 break-all rounded-[8px] border border-accent/30 bg-fill px-2 py-1.5 font-mono text-[11px] text-ice">
              Dev preview:{" "}
              <Link href={previewUrl} className="text-accent underline">
                open reset link
              </Link>
            </div>
          ) : null}
          <p className="mt-2 text-[11px] font-semibold text-steel">
            The link expires in 30 minutes. If you don&apos;t see the email, check your spam folder.
          </p>
        </div>
      ) : null}
      <p className="mt-4 text-[11.5px] font-semibold text-steel">
        Resetting the password for <strong className="text-ice">{panelName}</strong> signs you out
        of every device.
      </p>
      <div className="mt-5 border-t border-line pt-4 text-[12.5px] font-semibold text-steel">
        Remembered it?{" "}
        <Link href="/login" className={linkCls}>
          Back to Sign In
        </Link>
      </div>
    </>
  );
}
export function ResetForm({ panelName, token }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const firstField = useTopLevelFocus();
  if (!token && !done) {
    return (
      <>
        <p className="rounded-[12px] border border-danger/35 bg-danger/10 px-3 py-3 text-[12.5px] font-semibold text-danger">
          This reset link is missing a token. Open the link from your email or request a new one.
        </p>
        <div className="mt-5 border-t border-line pt-4 text-[12.5px] font-semibold text-steel">
          <Link href="/forgot" className={linkCls}>
            Request a new link
          </Link>
        </div>
      </>
    );
  }
  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      await api("/api/auth/reset", {
        body: {
          token,
          password,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }
  if (done) {
    return (
      <>
        <div className="rounded-[12px] border border-ok/30 bg-ok/10 px-3 py-3 text-left text-[12.5px] font-semibold text-ok">
          Your {panelName} password has been updated. Sign in with your new password below.
        </div>
        <div className="mt-5 border-t border-line pt-4 text-[12.5px] font-semibold text-steel">
          <Link href="/login" className={linkCls}>
            Go to Sign In
          </Link>
        </div>
      </>
    );
  }
  return (
    <>
      <form onSubmit={onSubmit} className="text-left">
        <label className={`mt-1 ${labelCls}`} htmlFor="reset-pass">
          New password
        </label>
        <PasswordInput
          id="reset-pass"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="8+ characters"
        />
        <label className={`mt-3 ${labelCls}`} htmlFor="reset-confirm">
          Confirm new password
        </label>
        <PasswordInput
          id="reset-confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <ErrorNote message={error} />
        <button type="submit" className="btn-accent mt-5 w-full" disabled={busy}>
          {busy ? <Spinner /> : <KeyRound className="size-4" />} Update password
        </button>
      </form>
      <div className="mt-5 border-t border-line pt-4 text-[12.5px] font-semibold text-steel">
        Wrong account?{" "}
        <Link href="/forgot" className={linkCls}>
          <RotateCcw className="mr-1 inline size-3 align-[-1px]" />
          Start over
        </Link>
      </div>
    </>
  );
}
