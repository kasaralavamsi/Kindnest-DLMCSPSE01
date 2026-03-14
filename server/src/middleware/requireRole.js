module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ ok: false, error: "Unauthorized" });
    if (!roles.includes(role)) return res.status(403).json({ ok: false, error: "Forbidden" });
    next();
  };
};