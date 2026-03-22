/**
 * GPS Location Model
 * Stores time-series GPS telemetry per vehicle/container
 */

const mongoose = require("mongoose");

const gpsLocationSchema = new mongoose.Schema(
  {
    // The driver/vehicle this location belongs to
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    containerId: {
      type: String,
      required: true,
    },
    // GPS coordinates
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    // Speed in km/h (0 = stopped)
    speed: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Heading in degrees (0-360)
    heading: {
      type: Number,
      default: 0,
    },
    // Geofence compliance at this point
    insideGeofence: {
      type: Boolean,
      default: true,
    },
    // AI anomaly detection result for this data point
    anomalyStatus: {
      type: String,
      enum: ["NORMAL", "ANOMALY", "UNKNOWN", "PENDING", "ERROR"],
      default: "PENDING",
    },
    anomalyDetails: {
      type: String,
      default: null,
    },
    // GPS signal quality — used for jamming detection
    signalStrength: {
      type: Number,   // dBm value sent by device; null = not reported
      default: null,
    },
    jammingSuspected: {
      type: Boolean,
      default: false,
    },
    // Tamper flag forwarded from IoT device
    tamperDetected: {
      type: Boolean,
      default: false,
    },
    // Source of the GPS data
    source: {
      type: String,
      enum: ["GPS", "LTE_TRIANGULATION", "BLE_BEACON", "IMU_DEAD_RECKONING", "MOBILE_APP", "DEVICE", "MANUAL"],
      default: "MOBILE_APP",
    },
  },
  {
    timestamps: true,
    // Automatically expire old GPS documents (30 days) using MongoDB TTL
    // Comment this out if you want to keep all history
    // expireAfterSeconds: 2592000
  }
);

// Compound index for efficient time-series queries per vehicle
gpsLocationSchema.index({ containerId: 1, createdAt: -1 });
gpsLocationSchema.index({ driverId: 1, createdAt: -1 });

module.exports = mongoose.model("GpsLocation", gpsLocationSchema);
