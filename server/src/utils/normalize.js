function normalizeEmail(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  return s.includes("@") ? s : null;
}

function normalizePhone(v) {
  if (!v) return null;
  let s = String(v).trim();

  // remove spaces, dashes, brackets
  s = s.replace(/[()\s-]/g, "");

  // allow leading +, otherwise digits only
  const ok = /^\+?\d{7,15}$/.test(s);
  return ok ? s : null;
}

function splitIdentifier(identifier) {
  const raw = String(identifier || "").trim();
  if (!raw) return { email: null, phone: null };

  if (raw.includes("@")) {
    return { email: normalizeEmail(raw), phone: null };
  }
  return { email: null, phone: normalizePhone(raw) };
}

module.exports = { normalizeEmail, normalizePhone, splitIdentifier };