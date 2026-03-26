/**
 * auth.js — Password-based auth for BOTH email and phone users.
 *
 * CHANGED FROM ORIGINAL:
 *  - Register: email users are now accepted here with a password (removed the
 *    "email must use OTP" rejection). Both email and phone go through the same
 *    password flow.
 *  - Login: same — email users can now log in with a password directly. The
 *    OTP redirect block is removed.
 *  - /me endpoint: unchanged.
 *
 * The OTP routes (server/src/routes/otp.js) and the otp route in app.js can
 * stay in place harmlessly — they just won't be called by the frontend anymore.
 */

const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const { splitIdentifier } = require("../utils/normalize");

// ─── Schemas ──────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  identifier: z.string().min(3).max(120),
  password: z.string().min(8).max(72),
  role: z.enum(["requester", "volunteer"]).optional().default("requester")
});

const LoginSchema = z.object({
  identifier: z.string().min(3).max(120),
  password: z.string().min(1).max(72)
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function publicUser(u) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email || null,
    phone: u.phone || null,
    role: u.role
  };
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES || "7d";
  return jwt.sign({ sub: user._id.toString(), role: user.role }, secret, { expiresIn });
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Accepts both email and phone with a password.

router.post("/register", async (req, res, next) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message || "Invalid input"
      });
    }

    const { name, identifier, password, role } = parsed.data;
    const { email, phone } = splitIdentifier(identifier);

    if (!email && !phone) {
      return res.status(400).json({
        ok: false,
        error: "Identifier must be a valid email address or phone number (e.g. +91XXXXXXXXXX)"
      });
    }

    // Check for duplicate
    if (email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ ok: false, error: "An account already exists with this email address" });
      }
    } else {
      const existing = await User.findOne({ phone });
      if (existing) {
        return res.status(409).json({ ok: false, error: "An account already exists with this phone number" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userData = email
      ? { name, email, passwordHash, role, emailVerified: false }
      : { name, phone, passwordHash, role };

    const user = await User.create(userData);

    const token = signToken(user);
    return res.status(201).json({ ok: true, token, user: publicUser(user) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ ok: false, error: "Account already exists with this email or phone" });
    }
    next(err);
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
// Accepts both email and phone with a password.

router.post("/login", async (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message || "Invalid input"
      });
    }

    const { identifier, password } = parsed.data;
    const { email, phone } = splitIdentifier(identifier);

    if (!email && !phone) {
      return res.status(400).json({
        ok: false,
        error: "Identifier must be a valid email address or phone number"
      });
    }

    // Find user by email or phone
    const query = email ? { email } : { phone };
    const user = await User.findOne(query).select("+passwordHash");

    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({ ok: true, token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me  (protected) ───────────────────────────────────────────

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
