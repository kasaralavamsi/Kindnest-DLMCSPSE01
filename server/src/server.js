require("dotenv").config();
const app = require("./app");
const connectDb = require("./db/connect");

const PORT = process.env.PORT || 8080;

async function start() {
  await connectDb(process.env.MONGO_URI);
  app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});