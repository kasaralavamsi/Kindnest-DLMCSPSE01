const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },

    // optional but unique if present
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    // Optional – email users authenticate via OTP only (no password)
    // Phone users always have a passwordHash
    passwordHash: { type: String, select: false },

    // Tracks whether an email was OTP-verified at registration
    emailVerified: { type: Boolean, default: false },

    role: {
      type: String,
      enum: ["requester", "volunteer", "admin"],
      default: "requester"
    }
  },
  { timestamps: true }
);

// unique when field exists
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", UserSchema);
