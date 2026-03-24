const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const { splitIdentifier } = require("../utils/normalize");

// Phone-only registration schema (email users go through OTP flow)
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

// ─── POST /api/auth/register  (phone only) ────────────────────────────────────
// Email users must register via POST /api/auth/otp/register/send + /verify
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

    // Email users must use the OTP registration flow instead
    if (email) {
      return res.status(400).json({
        ok: false,
        error:
          "Email sign-up uses OTP verification — no password needed. " +
          "Use the 'Create account' form and enter your email to receive a one-time code."
      });
    }

    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: "Identifier must be a valid phone number (e.g. +91XXXXXXXXXX)"
      });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({
        ok: false,
        error: "An account already exists with this phone number"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, phone, passwordHash, role });

    const token = signToken(user);
    return res.status(201).json({ ok: true, token, user: publicUser(user) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ ok: false, error: "Phone number already in use" });
    }
    next(err);
  }
});

// ─── POST /api/auth/login  (phone only) ───────────────────────────────────────
// Email users must log in via POST /api/auth/otp/send + /verify
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

    // Email users must use the OTP login flow
    if (email) {
      return res.status(400).json({
        ok: false,
        error:
          "Email login uses a one-time code — no password required. " +
          "Enter your email on the login page and we'll send you an OTP."
      });
    }

    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: "Identifier must be a valid phone number"
      });
    }

    const user = await User.findOne({ phone }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      // Safety-net: phone user somehow has no password (shouldn't happen)
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({ ok: true, token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me  (protected) ────────────────────────────────────────────
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
