import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * RFC 6238 TOTP, implemented directly so the panel has no runtime dependency
 * on an OTP package. Secrets are base32; codes are 6 digits derived from
 * HMAC-SHA1 over a 30-second counter, which is what every authenticator app
 * (Google Authenticator, Aegis, 1Password) speaks by default.
 */

const DIGITS = 6;
const PERIOD = 30;
/** Accept one step either side of "now" to absorb clock drift between the
 *  server and the phone. Wider windows meaningfully weaken the check. */
const WINDOW = 1;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function generateSecret(bytes = 20) {
  return base32Encode(randomBytes(bytes));
}
export function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}
export function base32Decode(input) {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out = [];
  for (const char of clean) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) throw new Error("Invalid base32 secret.");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
function hotp(secret, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", secret).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/** The code an authenticator app should be showing right now. */
export function currentCode(secret, at = Date.now()) {
  return hotp(base32Decode(secret), Math.floor(at / 1000 / PERIOD));
}

/** Constant-time comparison over equal-length digit strings. */
function safeEqual(a, b) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
export function verifyCode(secret, token, at = Date.now()) {
  if (typeof token !== "string") return false;
  const code = token.replace(/\s/g, "");
  if (!new RegExp(`^\\d{${DIGITS}}$`).test(code)) return false;
  let key;
  try {
    key = base32Decode(secret);
  } catch {
    return false;
  }
  const counter = Math.floor(at / 1000 / PERIOD);
  for (let drift = -WINDOW; drift <= WINDOW; drift++) {
    if (safeEqual(hotp(key, counter + drift), code)) return true;
  }
  return false;
}

/** otpauth:// URI that enrols the secret in a QR-code scanner. */
export function otpauthUrl(secret, account, issuer) {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
