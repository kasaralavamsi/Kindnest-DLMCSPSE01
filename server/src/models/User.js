const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },

    // optional but unique if present
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    passwordHash: { type: String, required: true, select: false },

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