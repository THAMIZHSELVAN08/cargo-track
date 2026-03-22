/**
 * GPS Controller
 * Handles live GPS updates, geofence validation, and AI anomaly analysis
 */

const GpsLocation = require("../models/GpsLocation");
const Vehicle = require("../models/Vehicle");
const { isInsideCircularGeofence, getDefaultGeofence } = require("../utils/geofence");
const { analyzeAnomaly } = require("../services/ai.service");
const { createEventLog } = require("../services/eventLogger.service");
const logger = require("../utils/logger");

// GPS signal strength threshold for jamming detection (dBm)
// Typical clear-sky GPS: -120 to -125 dBm. Below -130 = likely jammed.
const GPS_JAMMING_THRESHOLD_DBM = -130;

// If a driver has been stopped for this many minutes, require re-auth
const STOP_REAUTH_MINUTES = 15;

/**
 * POST /gps/update
 * Driver submits a real-time GPS coordinate.
 * Hardened with: jamming detection, tamper detection,
 *               UNKNOWN AI risk handling, stop re-auth check.
 */
exports.updateLocation = async (req, res) => {
  try {
    const {
      containerId,
      lat,
      lng,
      speed = 0,
      heading = 0,
      signalStrength = null,   // dBm from device (optional; null if device doesn't report)
      tamperDetected = false,  // Boolean from device hardware sensor
      source = "MOBILE_APP",  // GPS | LTE_TRIANGULATION | IMU_DEAD_RECKONING | MOBILE_APP
    } = req.body;

    const driver = req.user;

    // ── IMPROVEMENT 1: GPS Jamming Detection ──────────────────────────────
    // If device reports signal strength AND it's below threshold → suspect jamming.
    // We cannot 100% confirm in software (no weather API integration here),
    // but we flag, alert, and let dispatch decide.
    const jammingSuspected =
      signalStrength !== null && signalStrength < GPS_JAMMING_THRESHOLD_DBM;

    if (jammingSuspected) {
      logger.warn(
        `⚠️  GPS jamming suspected for container ${containerId}! ` +
        `Signal: ${signalStrength} dBm (threshold: ${GPS_JAMMING_THRESHOLD_DBM})`
      );
      await createEventLog({
        eventType: "GPS_JAMMING_SUSPECTED",
        user: driver,
        containerId,
        details: { lat, lng, signalStrength, source },
        outcome: "WARNING",
        ipAddress: req.ip,
      });
    }

    // ── IMPROVEMENT 2: Hardware Tamper Detection Cascade ─────────────────
    // IoT device reports tamper state from mesh/shock sensor.
    if (tamperDetected) {
      logger.error(`🚨 TAMPER DETECTED on container ${containerId}! Immediate response triggered.`);
      await createEventLog({
        eventType: "TAMPER_DETECTED",
        user: driver,
        containerId,
        details: { lat, lng, speed, signalStrength, source },
        outcome: "WARNING",   // Will escalate to CRITICAL in alert matrix
        ipAddress: req.ip,
      });
      // Immobilize engine as software response to tamper
      // (hardware relay triggered separately by IoT device's own logic)
      const Vehicle = require("../models/Vehicle");
      await Vehicle.findOneAndUpdate(
        { containerId },
        { engineStatus: "STOPPED", lockStatus: "LOCKED" },
        { upsert: false }
      );
    }

    // ── IMPROVEMENT 3: Stop Re-Authentication Check ────────────────────
    // If driver has been stationary >15 min, flag for re-auth on next unlock.
    if (speed === 0) {
      const GpsLoc = require("../models/GpsLocation");
      const fifteenMinAgo = new Date(Date.now() - STOP_REAUTH_MINUTES * 60 * 1000);
      const lastMovingPing = await GpsLoc.findOne({
        containerId,
        speed: { $gt: 0 },
        createdAt: { $gte: fifteenMinAgo },
      });

      if (!lastMovingPing) {
        // No movement in 15 min → flag vehicle for re-auth on next unlock
        const Vehicle = require("../models/Vehicle");
        await Vehicle.findOneAndUpdate(
          { containerId },
          { requiresReauth: true },
          { upsert: false }
        );
        logger.info(`Container ${containerId} stopped >15min — re-auth required on next unlock.`);
      }
    }

    // ── Geofence check ─────────────────────────────────────────────────
    const fence = getDefaultGeofence();
    const geofenceResult = isInsideCircularGeofence(lat, lng, fence);

    // ── Persist GPS point ──────────────────────────────────────────────
    const gpsPoint = await GpsLocation.create({
      driverId: driver._id,
      containerId,
      lat,
      lng,
      speed,
      heading,
      insideGeofence: geofenceResult.inside,
      anomalyStatus: "PENDING",
      signalStrength,
      jammingSuspected,
      tamperDetected,
      source,
    });

    // Update vehicle last known location (Auto-register if new)
    await Vehicle.findOneAndUpdate(
      { containerId },
      { 
        $set: { lastLocation: { lat, lng, updatedAt: new Date() } },
        $setOnInsert: { engineStatus: "RUNNING", lockStatus: "LOCKED" }
      },
      { upsert: true }
    );

    // Geofence breach log
    if (!geofenceResult.inside) {
      await createEventLog({
        eventType: "GEOFENCE_BREACH",
        user: driver,
        containerId,
        details: { lat, lng, distanceFromCenter: geofenceResult.distance },
        outcome: "WARNING",
        ipAddress: req.ip,
      });
      logger.warn(`Geofence breach by container ${containerId} at (${lat}, ${lng})`);
    }

    // ── IMPROVEMENT 4: AI Fallback — UNKNOWN/MEDIUM treated as warning ─
    setImmediate(async () => {
      try {
        const anomaly = await analyzeAnomaly({ lat, lng, speed, containerId, timestamp: new Date().toISOString() });

        let finalStatus = anomaly.status;
        // UNKNOWN from AI failure → store as UNKNOWN, log warning (not silent NORMAL)
        if (anomaly.status === "UNKNOWN") {
          finalStatus = "UNKNOWN";
          logger.warn(`AI unavailable for container ${containerId} — risk: ${anomaly.risk}`);
        }

        await GpsLocation.findByIdAndUpdate(gpsPoint._id, {
          anomalyStatus: finalStatus,
          anomalyDetails: anomaly.reason || (anomaly.status === "UNKNOWN" ? "AI service unavailable" : null),
        });

        if (anomaly.status === "ANOMALY") {
          await createEventLog({
            eventType: "ANOMALY_DETECTED",
            user: driver,
            containerId,
            details: { lat, lng, speed, reason: anomaly.reason, score: anomaly.score },
            outcome: "WARNING",
          });
          logger.warn(`Anomaly detected for container ${containerId}: ${anomaly.reason}`);
        }

        if (anomaly.status === "UNKNOWN" && anomaly.risk === "MEDIUM") {
          await createEventLog({
            eventType: "AI_UNAVAILABLE",
            user: driver,
            containerId,
            details: { lat, lng, speed, risk: anomaly.risk },
            outcome: "WARNING",
          });
        }
      } catch (err) {
        logger.error(`Async anomaly check failed: ${err.message}`);
      }
    });

    await createEventLog({
      eventType: "GPS_UPDATE",
      user: driver,
      containerId,
      details: { lat, lng, speed, source, insideGeofence: geofenceResult.inside, jammingSuspected, tamperDetected },
      outcome: "SUCCESS",
      ipAddress: req.ip,
    });

    res.json({
      message: "GPS location updated",
      locationId: gpsPoint._id,
      insideGeofence: geofenceResult.inside,
      distanceFromCenter: geofenceResult.distance,
      jammingSuspected,
      tamperDetected,
      ...(!geofenceResult.inside && { alert: "Vehicle is outside designated geofence!" }),
      ...(jammingSuspected && { criticalAlert: "GPS jamming suspected — dispatcher notified!" }),
      ...(tamperDetected && { criticalAlert: "Tamper detected — engine immobilized!" }),
    });
  } catch (err) {
    logger.error(`GPS update error: ${err.message}`);
    res.status(500).json({ error: "Failed to update GPS location." });
  }
};

/**
 * GET /gps/live/:containerId
 * Get the latest GPS location for a specific container
 */
exports.getLiveLocation = async (req, res) => {
  try {
    const latest = await GpsLocation.findOne({ containerId: req.params.containerId })
      .sort({ createdAt: -1 })
      .populate("driverId", "name email");

    if (!latest) return res.status(404).json({ error: "No GPS data found for this container." });

    res.json({ location: latest });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch location." });
  }
};

/**
 * GET /gps/history/:containerId
 * Get GPS history for a container (paginated)
 */
exports.getLocationHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const history = await GpsLocation.find({ containerId: req.params.containerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GpsLocation.countDocuments({ containerId: req.params.containerId });

    res.json({ total, history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch GPS history." });
  }
};

/**
 * GET /gps/all
 * Get latest position for ALL active vehicles (dashboard map view)
 */
exports.getAllLiveLocations = async (req, res) => {
  try {
    // MongoDB aggregation: get the latest GPS point per containerId
    const latest = await GpsLocation.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$containerId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);

    // Populate driver names
    const populated = await GpsLocation.populate(latest, {
      path: 'driverId',
      select: 'name',
    });

    // Map to include driverName directly for easy consumption by frontend
    const locations = populated.map(loc => ({
      ...loc,
      driverName: loc.driverId?.name || loc.containerId,
    }));

    res.json({ count: locations.length, locations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all locations.' });
  }
};

