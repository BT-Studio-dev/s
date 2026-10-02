import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
export class HttpError extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      {
        N: 16384,
        r: 8,
        p: 1,
      },
      (err, key) => (err ? reject(err) : resolve(key)),
    );
  });
}
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const [alg, saltHex, keyHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const key = await scryptAsync(password, Buffer.from(saltHex, "hex"));
  return key.length === expected.length && timingSafeEqual(key, expected);
}
export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
export function newId(prefix) {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}
export function newToken() {
  return randomBytes(32).toString("base64url");
}
