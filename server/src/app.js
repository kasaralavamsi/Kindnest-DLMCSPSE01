const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const healthRoute = require("./routes/health");
const authRoute = require("./routes/auth");
const tasksRoute = require("./routes/tasks");
const adminRoute = require("./routes/admin");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL || "https://kindnest-vamsi.netlify.app"
];

app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// routes
app.get("/", (req, res) => {
  res.json({ ok: true, message: "KindNest API is running. Try /api/health" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/health", healthRoute);
app.use("/api/auth", authRoute);
app.use("/api/tasks", tasksRoute);
app.use("/api/admin", adminRoute);

app.use(notFound);
app.use(errorHandler);

module.exports = app;