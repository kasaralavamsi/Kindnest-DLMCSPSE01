const jwt = require("jsonwebtoken");

module.exports = function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ ok: false, error: "Missing or invalid Authorization header" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ ok: false, error: "JWT_SECRET is not set on the server" });
    }

    const decoded = jwt.verify(token, secret);
    req.auth = decoded; // { sub, role, iat, exp }
    req.userId = decoded.sub;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
};