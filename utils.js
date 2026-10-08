// Small helpers with no outside dependencies (so they are easy to test).
const crypto = require("crypto");

const MAX_IMAGE_BYTES = 300 * 1024; // 300 KB after the browser shrinks it

// "instagram.com/page" works as well as "https://instagram.com/page"
function normalizeLink(value) {
  const text = String(value == null ? "" : value).trim();
  if (!text || text.length > 500 || /\s/.test(text)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : "https://" + text;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// Accepts a data URL like "data:image/jpeg;base64,...." and checks it is a real small image.
function parseImage(dataUrl) {
  if (typeof dataUrl !== "string" || dataUrl.length > 450000) return null;
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!m) return null;
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length < 12 || buffer.length > MAX_IMAGE_BYTES) return null;

  const type = m[1];
  let looksRight = false;
  if (type === "image/jpeg") {
    looksRight = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  } else if (type === "image/png") {
    looksRight = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  } else {
    looksRight =
      buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
      buffer.subarray(8, 12).toString("latin1") === "WEBP";
  }
  return looksRight ? { buffer, contentType: type } : null;
}

// Compares two strings without leaking how many characters matched.
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Admin login: the email and password live ONLY in server environment variables.
// Returns "ok", "bad" or "not_configured".
function checkAdmin(email, password, env) {
  env = env || process.env;
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return "not_configured";
  if (typeof email !== "string" || typeof password !== "string") return "bad";
  const emailOk = safeEqual(email.trim().toLowerCase(), env.ADMIN_EMAIL.trim().toLowerCase());
  const passOk = safeEqual(password, env.ADMIN_PASSWORD);
  return emailOk && passOk ? "ok" : "bad";
}

module.exports = { normalizeLink, parseImage, safeEqual, checkAdmin, MAX_IMAGE_BYTES };
