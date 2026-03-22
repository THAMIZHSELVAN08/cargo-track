/**
 * Unlock Request Model
 * Tracks container unlock requests through their full lifecycle:
 * PENDING → APPROVED / REJECTED → UNLOCKED
 */

const mongoose = require("mongoose");

const unlockRequestSchema = new mongoose.Schema(
  {
    // The driver who initiated the unlock request
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ── Dual-Control (4-Eyes) Approval Fields ─────────────────────────────
    // Primary dispatcher who gave first approval
    dispatcherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    primaryApprovalAt: { type: Date, default: null },

    // Secondary dispatcher required for high-risk or high-value cargo
    secondaryDispatcherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    secondaryApprovalAt: { type: Date, default: null },

    // Whether dual-control is required for this request (set at request time)
    requiresDualApproval: { type: Boolean, default: false },

    // Approval window — both dispatchers must approve within this time
    approvalWindowMinutes: { type: Number, default: 5 },

    // Request lifecycle status
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL_APPROVED", "APPROVED", "REJECTED", "UNLOCKED", "EXPIRED"],
      default: "PENDING",
    },
    // Notes from dispatcher (approval/rejection reason)
    dispatcherNotes: { type: String, default: null },

    // When the final action was taken
    resolvedAt: { type: Date, default: null },

    // Blockchain transaction hash for tamper-proof audit trail
    blockchainTxHash: { type: String, default: null },

    // Set by GPS controller when vehicle stopped >15 min
    reauthRequired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient queries by driver and status
unlockRequestSchema.index({ driverId: 1, status: 1 });
unlockRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("UnlockRequest", unlockRequestSchema);
