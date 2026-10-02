/**
 * Lightweight mail helper. Three transports (tried in order):
 *
 *   1. **DB-stored SMTP** — values from `panel_settings` (admin-configured
 *      via the Settings UI). This is the recommended path: SMTP can be
 *      edited from inside the panel without redeploying.
 *   2. **Env SMTP** — used when the DB has no host but SMTP_HOST is set in
 *      env. Lets a sandbox / production deploy ship secrets via env while
 *      a small install can still configure via UI.
 *   3. **Console** — fallback when neither DB nor env has a host. The
 *      message is printed to stdout *and* returned as `previewUrl` so the
 *      operator can copy the link during development.
 *
 * Either way, `sendMail()` is fire-and-forget: errors are logged but
 * never thrown to the caller (the response stays the same whether or
 * not the email actually goes out — anti-enumeration on the forgot
 * endpoint).
 */

function envBool(v, fallback) {
  if (v === undefined) return fallback;
  return /^(1|true|yes|on)$/i.test(v.trim());
}
function envInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}
function fromEnv() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  return {
    host,
    port: envInt(process.env.SMTP_PORT, 587),
    secure: envBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER?.trim() ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM?.trim() || "BT Panel <no-reply@btpanel.local>",
  };
}
function fromSettingsLike(row) {
  if (!row) return null;
  const host = (row.smtpHost ?? "").trim();
  if (!host) return null;
  return {
    host,
    port:
      typeof row.smtpPort === "number" && row.smtpPort > 0 && row.smtpPort < 65536
        ? Math.round(row.smtpPort)
        : 587,
    secure: !!row.smtpSecure,
    user: (row.smtpUser ?? "").trim(),
    pass: row.smtpPass ?? "",
    from: (row.smtpFrom ?? "").trim() || "BT Panel <no-reply@btpanel.local>",
  };
}

/** Pull SMTP config from the panel DB (single-row `panel_settings`). This
 *  is wrapped in a dynamic import so the helper itself has no hard
 *  dependency on the data layer (which would cycle with the API routes). */
async function fromDb() {
  try {
    const { getSettings } = await import("@/lib/server/data");
    return fromSettingsLike(await getSettings());
  } catch (err) {
    // DB not ready yet (boot) — silently fall back to env.
    console.warn(
      "[bt-panel] mail: DB lookup failed, falling back to env:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Minimal SMTP client (no deps). Speaks EHLO / STARTTLS / AUTH LOGIN /
 * MAIL FROM / RCPT TO / DATA / QUIT. Sufficient for password-reset mail
 * via any modern relay (Mailgun, SES smtp, Gmail, Resend SMTP, etc).
 *
 * For the typical STARTTLS-on-port-587 case we wrap the socket in TLS
 * after the greeting and then speak the rest of the session in plaintext.
 * For SMTPS (port 465 / SMTP_SECURE=true) we wrap from the start.
 */
async function sendViaSmtp(cfg, msg) {
  const net = await import("node:net");
  const tls = await import("node:tls");
  const socket = net.createConnection({
    host: cfg.host,
    port: cfg.port,
  });
  await new Promise((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("error", reject);
  });

  // We rebind `reader` whenever the underlying stream changes (i.e. after
  // STARTTLS). Reads always go through the *current* stream so we never end
  // up reading from the plain socket while the server is talking TLS.
  let stream = socket;
  let reader = createLineReader(stream);

  // Read greeting.
  const greeting = await reader.read();
  if (!greeting.startsWith("220")) throw new Error(`smtp greeting failed: ${greeting}`);
  if (!cfg.secure) {
    await sendCommand(stream, "EHLO bt-panel.local");
    await expectCode(reader, "250");
    await sendCommand(stream, "STARTTLS");
    await expectCode(reader, "220");
    // Upgrade to TLS on top of the existing TCP socket. After this point
    // all reads/writes MUST go through the TLS stream — the plain socket
    // will not receive any more data from the server.
    const tlsSocket = tls.connect({
      socket: socket,
      servername: cfg.host,
    });
    await new Promise((resolve, reject) => {
      tlsSocket.once("secureConnect", () => resolve());
      tlsSocket.once("error", reject);
    });
    stream = tlsSocket;
    reader = createLineReader(stream);
    await sendCommand(stream, "EHLO bt-panel.local");
    await expectCode(reader, "250");
  } else {
    await sendCommand(stream, "EHLO bt-panel.local");
    await expectCode(reader, "250");
  }
  if (cfg.user) {
    await sendCommand(stream, "AUTH LOGIN");
    await expectCode(reader, "334");
    await sendCommand(stream, Buffer.from(cfg.user).toString("base64"));
    await expectCode(reader, "334");
    await sendCommand(stream, Buffer.from(cfg.pass).toString("base64"));
    await expectCode(reader, "235");
  }
  await sendCommand(stream, `MAIL FROM:<${parseAddress(cfg.from)}>`);
  await expectCode(reader, "250");
  await sendCommand(stream, `RCPT TO:<${msg.to}>`);
  await expectCode(reader, "250");
  await sendCommand(stream, "DATA");
  await expectCode(reader, "354");
  const headers = [
    `From: ${cfg.from}`,
    `To: ${msg.to}`,
    `Subject: ${msg.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    `Date: ${new Date().toUTCString()}`,
  ].join("\r\n");
  const body = msg.text.replace(/\r?\n/g, "\r\n");
  stream.write(`${headers}\r\n\r\n${body}\r\n.\r\n`);
  await expectCode(reader, "250");
  await sendCommand(stream, "QUIT");
  stream.end();
}
function parseAddress(from) {
  const m = from.match(/<([^>]+)>/);
  return (m ? m[1] : from).trim();
}
function createLineReader(socket) {
  let buffer = "";
  // FIFO of pending resolvers — when multiple lines arrive in a single chunk
  // we need to hand each one to the next waiter in turn. Using a single
  // `waiter` variable (the original implementation) only delivered the first
  // line per chunk and silently dropped the rest, which is what caused
  // `smtp expected 220, got 250-SIZE` whenever the server pipelined a
  // greeting + EHLO response into the same TCP segment.
  const waiters = [];
  const onData = (chunk) => {
    buffer += chunk.toString("utf8");
    let idx = buffer.indexOf("\n");
    while (idx >= 0) {
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      const w = waiters.shift();
      if (w) w(line);
      idx = buffer.indexOf("\n");
    }
  };
  socket.on("data", onData);
  return {
    read() {
      return new Promise((resolve) => {
        waiters.push(resolve);
      });
    },
  };
}
async function sendCommand(socket, line) {
  socket.write(`${line}\r\n`);
}
async function expectCode(reader, code) {
  // SMTP multi-line responses (e.g. EHLO) put a `-` between the code and
  // the rest of the line, and keep going until a final line with just
  // `<code> ` (or `<code>`). We have to drain those continuation lines too
  // — otherwise the next command's reply is shifted and every subsequent
  // expectCode throws.
  let last = "";
  for (;;) {
    const line = await reader.read();
    if (line.length < 3) throw new Error(`smtp malformed reply: ${line}`);
    const replyCode = line.slice(0, 3);
    if (!last) {
      // First line MUST start with the code we're expecting.
      if (replyCode !== code) throw new Error(`smtp expected ${code}, got ${line}`);
    } else {
      // Continuation lines must share the same code.
      if (replyCode !== code) throw new Error(`smtp expected ${code} continuation, got ${line}`);
    }
    last = line;
    // No `-` after the code → this is the final line of the reply.
    if (line[3] !== "-") return line;
  }
}

/** Build the standard password reset email body. */
export function passwordResetEmail({ url, panelName, ttlMinutes }) {
  const subject = `Reset your ${panelName} password`;
  const text = [
    `Someone (hopefully you) asked to reset the password on your ${panelName} account.`,
    "",
    "Open this link within the next " + ttlMinutes + " minutes to choose a new password:",
    url,
    "",
    "If you didn't request this, you can safely ignore this email — your password will stay the same.",
    "",
    `— ${panelName}`,
  ].join("\n");
  return {
    subject,
    text,
  };
}

/**
 * Try DB → env. Either SMTP transport will deliver. If neither is
 * configured, fall back to the console transport which logs the
 * message and surfaces a `previewUrl` for dev sandboxes.
 */
export async function sendMail(msg) {
  const dbCfg = await fromDb();
  const cfg = dbCfg ?? fromEnv();
  if (!cfg) {
    // Console transport — also surface the link to the API caller so dev
    // sandboxes (where there's no SMTP) can copy the reset URL.
    const previewUrl = msg.text.match(/https?:\/\/\S+/)?.[0];
    console.log(
      [
        "\n────── [mail:console] ──────",
        `To:      ${msg.to}`,
        `Subject: ${msg.subject}`,
        "─────────────────────────────",
        msg.text,
        "─────────────────────────────\n",
      ].join("\n"),
    );
    return {
      ok: true,
      previewUrl,
    };
  }
  try {
    await sendViaSmtp(cfg, msg);
    return {
      ok: true,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "smtp send failed";
    console.error("[bt-panel] mail send failed:", error);
    return {
      ok: false,
      error,
    };
  }
}
