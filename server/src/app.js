const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const healthRoute = require("./routes/health");
const authRoute = require("./routes/auth");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const tasksRoute = require("./routes/tasks");
const adminRoute = require("./routes/admin");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://kindnest-vamsi.netlify.app/"
    ],
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use("/api/tasks", tasksRoute);

// routes
app.get("/", (req, res) => res.json({ ok: true, message: "KindNest API is running. Try /api/health" }));
app.use("/api/health", healthRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;