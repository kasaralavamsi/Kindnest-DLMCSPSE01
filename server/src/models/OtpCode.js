const mongoose = require("mongoose");

const OtpCodeSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, lowercase: true, trim: true }, // email or phone
    channel:    { type: String, enum: ["email", "phone"], required: true },
    codeHash:   { type: String, required: true },
    expiresAt:  { type: Date, required: true },
    consumed:   { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Auto-delete expired docs (MongoDB TTL index)
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Quickly look up a pending OTP by identifier
OtpCodeSchema.index({ identifier: 1, consumed: 1 });

module.exports = mongoose.model("OtpCode", OtpCodeSchema);
