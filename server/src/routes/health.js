const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({ ok: true, service: "kindnest-api" });
});

module.exports = router;