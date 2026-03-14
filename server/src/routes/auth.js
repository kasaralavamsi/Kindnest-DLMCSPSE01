const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const { splitIdentifier } = require("../utils/normalize");

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

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid input" });
    }

    const { name, identifier, password, role } = parsed.data;
    const { email, phone } = splitIdentifier(identifier);

    if (!email && !phone) {
      return res.status(400).json({ ok: false, error: "Identifier must be a valid email or phone number" });
    }

    // check existing
    const existing = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });

    if (existing) {
      return res.status(409).json({ ok: false, error: "Account already exists with this email/phone" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      passwordHash,
      role
    });

    const token = signToken(user);
    return res.status(201).json({ ok: true, token, user: publicUser(user) });
  } catch (err) {
    // Handle duplicate key (race condition)
    if (err?.code === 11000) {
      return res.status(409).json({ ok: false, error: "Email/phone already in use" });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid input" });
    }

    const { identifier, password } = parsed.data;
    const { email, phone } = splitIdentifier(identifier);

    if (!email && !phone) {
      return res.status(400).json({ ok: false, error: "Identifier must be a valid email or phone number" });
    }

    const user = await User.findOne(
      email ? { email } : { phone }
    ).select("+passwordHash");

    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = signToken(user);
    // re-fetch without passwordHash selection (or just strip it)
    return res.json({ ok: true, token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me (protected)
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