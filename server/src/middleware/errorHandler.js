module.exports = (err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    ok: false,
    error: err.message || "Internal Server Error"
  });
};