/**
 * Event Log Model
 * Immutable audit trail for all system events — stored in MongoDB
 * Hash is simultaneously stored on Ethereum blockchain for tamper-proofing
 */

const mongoose = require("mongoose");

const eventLogSchema = new mongoose.Schema(
  {
    // Category of event
    eventType: {
      type: String,
      enum: [
        "LOGIN_SUCCESS",
        "LOGIN_FAILURE",
        "LOGOUT",
        "UNLOCK_REQUEST",
        "UNLOCK_PARTIAL_APPROVED",
        "UNLOCK_APPROVED",
        "UNLOCK_REJECTED",
        "UNLOCK_EXECUTED",
        "GPS_UPDATE",
        "GEOFENCE_BREACH",
        "ANOMALY_DETECTED",
        "GPS_JAMMING_SUSPECTED",
        "TAMPER_DETECTED",
        "AI_UNAVAILABLE",
        "DUAL_APPROVAL_BYPASS_ATTEMPT",
        "ENGINE_IMMOBILIZED",
        "ENGINE_STARTED",
        "BIOMETRIC_VERIFIED",
        "BIOMETRIC_FAILED",
        "BIOMETRIC_SPOOF_SUSPECTED",
        "BLOCKCHAIN_LOGGED",
        "SYSTEM_EVENT",
      ],
      required: true,
    },
    // Actor who triggered the event
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userRole: {
      type: String,
      default: null,
    },
    containerId: {
      type: String,
      default: null,
    },
    // Flexible payload for event-specific data
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Result of action — CRITICAL triggers escalation pipeline
    outcome: {
      type: String,
      enum: ["SUCCESS", "FAILURE", "WARNING", "CRITICAL", "INFO"],
      default: "INFO",
    },
    // SHA-256 hash of the log entry (submitted to blockchain)
    dataHash: {
      type: String,
      required: true,
    },
    // Ethereum transaction hash — null until blockchain confirmation
    blockchainTxHash: {
      type: String,
      default: null,
    },
    blockchainConfirmed: {
      type: Boolean,
      default: false,
    },
    // IP address for security auditing
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    // Logs should never be deleted — use MongoDB's immutable collections in production
  }
);

// Index for efficient dashboard panel queries
eventLogSchema.index({ eventType: 1, createdAt: -1 });
eventLogSchema.index({ userId: 1, createdAt: -1 });
eventLogSchema.index({ containerId: 1, createdAt: -1 });

module.exports = mongoose.model("EventLog", eventLogSchema);
