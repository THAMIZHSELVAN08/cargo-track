/**
 * Vehicle Model
 * Tracks container/vehicle status including engine immobilization state
 */

const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    containerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    vehicleName: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Engine/immobilization state
    engineStatus: {
      type: String,
      enum: ["RUNNING", "STOPPED", "UNKNOWN"],
      default: "STOPPED",
    },
    // Who last changed the engine state and when
    lastImmobilizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastImmobilizedAt: {
      type: Date,
      default: null,
    },
    // Last known GPS position
    lastLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    // Container lock state
    lockStatus: {
      type: String,
      enum: ["LOCKED", "UNLOCKED"],
      default: "LOCKED",
    },
    // Active geofence configuration for this vehicle
    geofence: {
      centerLat: { type: Number, default: null },
      centerLng: { type: Number, default: null },
      radiusMeters: { type: Number, default: 5000 },
      type: { type: String, enum: ["CIRCLE", "POLYGON"], default: "CIRCLE" },
      polygonPoints: [{ lat: Number, lng: Number }],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ── Security & Re-Auth Flags ─────────────────────────────────────────
    // Set by GPS controller if vehicle stopped >15 min; cleared on unlock
    requiresReauth: { type: Boolean, default: false },
    // Set by tamper detection cascade — cleared by admin after investigation
    tamperDetected: { type: Boolean, default: false },
    // Set by GPS controller on jamming detection
    jammingSuspected: { type: Boolean, default: false },
    // Blockchain tx hash of last state-change event
    lastBlockchainTxHash: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
