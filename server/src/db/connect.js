const mongoose = require("mongoose");

module.exports = async function connectDb(uri) {
  if (!uri) throw new Error("MONGO_URI is missing in .env");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  console.log("✅ Connected to MongoDB");
};