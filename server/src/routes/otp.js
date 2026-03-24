/**
 * Email OTP Authentication Routes
 *
 * LOGIN flow  (for existing email accounts):
 *   POST /api/auth/otp/send            – send OTP to existing user's email
 *   POST /api/auth/otp/verify          – verify OTP, return JWT
 *
 * REGISTRATION flow  (for new email accounts):
 *   POST /api/auth/otp/register/send   – validate new details & send OTP
 *   POST /api/auth/otp/register/verify – verify OTP, create account, return JWT
 *
 * Phone users do NOT use this router – they authenticate with
 * password via /api/auth/register and /api/auth/login.
 */

const router = require("express").Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const User = require("../models/User");
const OtpCode = require("../models/OtpCode");
const { splitIdentifier } = require("../utils/normalize");
const { sendEmailOtp } = require("../utils/sendEmailOtp");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Cryptographically secure 6-digit OTP */
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES || "7d";
  return jwt.sign({ sub: user._id.toString(), role: user.role }, secret, { expiresIn });
}

function publicUser(u) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email || null,
    phone: u.phone || null,
    role: u.role
  };
}

/**
 * Extract and validate email from an identifier string.
 * Returns null if the identifier is not an email (e.g. a phone number).
 */
function parseEmail(identifier) {
  const { email } = splitIdentifier(String(identifier || "").trim());
  return email; // null if not an email
}

/** OTP is valid for 5 minutes */
const OTP_TTL_MS = 5 * 60 * 1000;

/**
 * Invalidate any previous unconsumed OTPs for this email,
 * generate a new one, persist it hashed, and send it via Gmail.
 */
async function issueAndSendOtp(email) {
  // Invalidate old OTPs so only the latest one can be used
  await OtpCode.updateMany(
    { identifier: email, consumed: false },
    { $set: { consumed: true } }
  );

  const otp = generateOtp();
  const codeHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await OtpCode.create({ identifier: email, channel: "email", codeHash, expiresAt });
  await sendEmailOtp(email, otp);
}

/**
 * Find the most recent valid (unconsumed, non-expired) OTP record for
 * the given email, verify the supplied code against its hash, mark it
 * consumed, and return the record.
 * Returns null if no valid record is found or the code doesn't match.
 */
async function consumeOtp(email, code) {
  const record = await OtpCode.findOne({
    identifier: email,
    consumed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!record) return { ok: false, reason: "expired" };

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) return { ok: false, reason: "wrong" };

  record.consumed = true;
  await record.save();
  return { ok: true };
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const SendSchema = z.object({
  identifier: z.string().min(3).max(120)
});

const VerifySchema = z.object({
  identifier: z.string().min(3).max(120),
  code: z.string().length(6).regex(/^\d{6}$/, "OTP must be exactly 6 digits")
});

const RegisterSendSchema = z.object({
  identifier: z.string().min(3).max(120),
  name: z.string().min(2).max(80),
  role: z.enum(["requester", "volunteer"]).optional().default("requester")
});

const RegisterVerifySchema = z.object({
  identifier: z.string().min(3).max(120),
  code: z.string().length(6).regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  name: z.string().min(2).max(80),
  role: z.enum(["requester", "volunteer"]).optional().default("requester")
});

// ─── LOGIN: POST /api/auth/otp/send ───────────────────────────────────────────
// User must already have an account. Phone users are rejected here.

router.post("/send", async (req, res, next) => {
  try {
    const parsed = SendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message || "Invalid input"
      });
    }

    const email = parseEmail(parsed.data.identifier);
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid email address. Phone users log in with their password."
      });
    }

    // User must exist to receive a login OTP
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "No account found with this email address. Please register first."
      });
    }

    await issueAndSendOtp(email);

    return res.json({
      ok: true,
      channel: "email",
      message: "A 6-digit code has been sent to your email address. It expires in 5 minutes."
    });
  } catch (err) {
    console.error("[OTP login send error]", err?.message || err);
    next(err);
  }
});

// ─── LOGIN: POST /api/auth/otp/verify ─────────────────────────────────────────
// Verify OTP and issue a JWT for an existing email account.

router.post("/verify", async (req, res, next) => {
  try {
    const parsed = VerifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message || "Invalid input"
      });
    }

    const email = parseEmail(parsed.data.identifier);
    if (!email) {
      return res.status(400).json({ ok: false, error: "Invalid email address" });
    }

    const { code } = parsed.data;
    const result = await consumeOtp(email, code);

    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        error:
          result.reason === "expired"
            ? "OTP has expired or was not found. Please request a new one."
            : "Incorrect OTP. Please check and try again."
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Edge case: account deleted between send and verify
      return res.status(404).json({ ok: false, error: "User account not found." });
    }

    const token = signToken(user);
    return res.json({ ok: true, token, user: publicUser(user) });
  } catch (err) {
    console.error("[OTP login verify error]", err?.message || err);
    next(err);
  }
});

// ─── REGISTER: POST /api/auth/otp/register/send ───────────────────────────────
// Validate registration details and send OTP for a NEW email account.
// The email must NOT already be registered.

router.post("/register/send", async (req, res, next) => {
  try {
    const parsed = RegisterSendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message || "Invalid input"
      });
    }

    const email = parseEmail(parsed.data.identifier);
    if (!email) {
      return res.status(400).json({
        ok: false,
        error:
          "Please enter a valid email address. " +
          "Phone users register with a password via the standard form."
      });
    }

    // Make sure this email is not already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        ok: false,
        error: "An account with this email already exists. Please log in instead."
      });
    }

    await issueAndSendOtp(email);

    return res.json({
      ok: true,
      channel: "email",
      message: "A 6-digit verification code has been sent to your email. It expires in 5 minutes."
    });
  } catch (err) {
    console.error("[OTP register send error]", err?.message || err);
    next(err);
  }
});

// ─── REGISTER: POST /api/auth/otp/register/verify ────────────────────────────
// Verify OTP, create the account, and return a JWT.

router.post("/register/verify", async (req, res, next) => {
  try {
    const parsed = RegisterVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message || "Invalid input"
      });
    }

    const email = parseEmail(parsed.data.identifier);
    if (!email) {
      return res.status(400).json({ ok: false, error: "Invalid email address" });
    }

    const { code, name, role } = parsed.data;

    // Re-check for duplicate (handles race condition between send & verify)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        ok: false,
        error: "An account with this email already exists. Please log in."
      });
    }

    const result = await consumeOtp(email, code);
    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        error:
          result.reason === "expired"
            ? "OTP has expired or was not found. Please request a new one."
            : "Incorrect OTP. Please check and try again."
      });
    }

    // OTP verified — create the account (no password for email users)
    const user = await User.create({ name, email, role, emailVerified: true });

    const token = signToken(user);
    return res.status(201).json({ ok: true, token, user: publicUser(user) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ ok: false, error: "Email already in use" });
    }
    console.error("[OTP register verify error]", err?.message || err);
    next(err);
  }
});

module.exports = router;
