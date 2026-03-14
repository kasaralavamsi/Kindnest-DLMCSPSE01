const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    address: { type: String, trim: true, maxlength: 250, default: "" },


    category: {
      type: String,
      enum: ["grocery", "pharmacy", "companionship", "transport", "household", "other"],
      default: "other"
    },

    status: {
      type: String,
      enum: ["OPEN", "ACCEPTED", "DONE", "CLOSED"],
      default: "OPEN",
      index: true
    },

    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    neededBy: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    doneAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, trim: true, maxlength: 1000, default: null },
    tipAmount: { type: Number, min: 0, max: 500, default: 0 },

    // ✅ Moderation (soft delete)
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    history: [
      {
        at: { type: Date, default: Date.now },
        action: { type: String, required: true }, // CREATED, ACCEPTED, REJECTED, DONE, CLOSED, ARCHIVED, UNARCHIVED, REOPENED_BY_ADMIN
        byUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);