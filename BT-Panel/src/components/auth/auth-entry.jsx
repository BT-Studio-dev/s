"use client";

import { useCallback, useEffect, useState } from "react";
import { getLocalModeOverride } from "@/lib/panel/theme";
import {
  api,
  cachePanel,
  clearCachedPanel,
  clearStoredToken,
  getCachedPanel,
  getStoredToken,
} from "@/lib/utils";
import { PanelShell } from "@/components/panel/shell";
import {
  AuthShell,
  ForgotForm,
  LoginForm,
  RegisterForm,
  RegistrationClosed,
  ResetForm,
} from "./auth-forms";
/**
 * Hosts the whole signed-out flow and, the moment sign-in (or sign-up)
 * succeeds, swaps the dashboard in **in the same document** — no navigation
 * and no loading screen in between. The payload is also cached so any later
 * load of "/" paints Home instantly instead of showing an opening screen.
 */
export function AuthEntry({
  mode,
  theme,
  panelName,
  panelLogo,
  title,
  subtitle,
  allowRegistration = true,
  demos = [],
  registrationOpen = true,
  firstUser = false,
  resetToken = "",
  google,
  passwordResetEnabled = true,
}) {
  const [panel, setPanel] = useState(() => (getStoredToken() ? getCachedPanel() : null));
  const open = useCallback((data) => {
    cachePanel(data);
    // Reflect "/" without asking the server for a new document.
    window.history.replaceState(null, "", "/");
    setPanel(data);
  }, []);

  // Returning with a still-valid session? Paint the cached dashboard at once
  // and let the network call refresh it underneath.
  useEffect(() => {
    if (!getStoredToken()) return;
    let cancelled = false;
    api("/api/bootstrap")
      .then((data) => {
        if (cancelled) return;
        cachePanel(data);
        setPanel(data);
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredToken();
        clearCachedPanel();
        setPanel(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  if (panel) {
    return (
      <PanelShell initial={panel} initialView="home" initialModeOverride={getLocalModeOverride()} />
    );
  }
  return (
    <AuthShell
      theme={theme}
      panelName={panelName}
      panelLogo={panelLogo}
      title={title}
      subtitle={subtitle}
    >
      {mode === "login" ? (
        <LoginForm
          allowRegistration={allowRegistration}
          demos={demos}
          google={{
            googleOauthEnabled: google?.googleOauthEnabled ?? false,
            googleClientId: google?.googleClientId ?? "",
          }}
          onAuthenticated={open}
        />
      ) : mode === "register" ? (
        registrationOpen || firstUser ? (
          <RegisterForm onAuthenticated={open} />
        ) : (
          <RegistrationClosed />
        )
      ) : mode === "forgot" ? (
        <ForgotForm panelName={panelName} enabled={passwordResetEnabled} />
      ) : (
        <ResetForm panelName={panelName} token={resetToken} />
      )}
    </AuthShell>
  );
}
