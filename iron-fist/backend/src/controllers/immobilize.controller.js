/**
 * Immobilize Controller
 * Allows dispatchers to remotely stop or start a vehicle's engine
 */

const Vehicle = require("../models/Vehicle");
const { createEventLog } = require("../services/eventLogger.service");
const logger = require("../utils/logger");

/**
 * POST /immobilize
 * Dispatcher triggers engine immobilization or restart
 * Body: { containerId, action: "STOP" | "START", reason }
 */
exports.setEngineState = async (req, res) => {
  try {
    const { containerId, action, reason } = req.body;
    const dispatcher = req.user;

    const vehicle = await Vehicle.findOne({ containerId });
    if (!vehicle) {
      return res.status(404).json({ error: `Vehicle with container ID "${containerId}" not found.` });
    }

    if (action === "STOP") {
      if (vehicle.engineStatus === "STOPPED") {
        return res.status(409).json({ error: "Engine is already stopped." });
      }

      vehicle.engineStatus = "STOPPED";
      vehicle.lastImmobilizedBy = dispatcher._id;
      vehicle.lastImmobilizedAt = new Date();
      await vehicle.save();

      await createEventLog({
        eventType: "ENGINE_IMMOBILIZED",
        user: dispatcher,
        containerId,
        details: { reason, previousStatus: "RUNNING", newStatus: "STOPPED" },
        outcome: "SUCCESS",
        ipAddress: req.ip,
      });

      logger.warn(`🛑 Engine IMMOBILIZED: ${containerId} by ${dispatcher.email} — Reason: ${reason}`);

      return res.json({
        message: "Engine immobilization signal sent successfully.",
        containerId,
        engineStatus: "STOPPED",
        immobilizedBy: dispatcher.name,
        timestamp: new Date().toISOString(),
      });

    } else if (action === "START") {
      if (vehicle.engineStatus === "RUNNING") {
        return res.status(409).json({ error: "Engine is already running." });
      }

      vehicle.engineStatus = "RUNNING";
      await vehicle.save();

      await createEventLog({
        eventType: "ENGINE_STARTED",
        user: dispatcher,
        containerId,
        details: { reason, previousStatus: "STOPPED", newStatus: "RUNNING" },
        outcome: "SUCCESS",
        ipAddress: req.ip,
      });

      logger.info(`✅ Engine STARTED: ${containerId} by ${dispatcher.email}`);

      return res.json({
        message: "Engine start signal sent successfully.",
        containerId,
        engineStatus: "RUNNING",
        timestamp: new Date().toISOString(),
      });
    }

    res.status(400).json({ error: 'Invalid action. Use "STOP" or "START".' });
  } catch (err) {
    logger.error(`Immobilize error: ${err.message}`);
    res.status(500).json({ error: "Failed to send engine control signal." });
  }
};

/**
 * GET /immobilize/status/:containerId
 * Get current engine status for a container
 */
exports.getEngineStatus = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ containerId: req.params.containerId })
      .populate("lastImmobilizedBy", "name email");

    if (!vehicle) return res.status(404).json({ error: "Vehicle not found." });

    res.json({
      containerId: vehicle.containerId,
      engineStatus: vehicle.engineStatus,
      lastImmobilizedBy: vehicle.lastImmobilizedBy,
      lastImmobilizedAt: vehicle.lastImmobilizedAt,
      lockStatus: vehicle.lockStatus,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch engine status." });
  }
};

/**
 * GET /immobilize/status/all
 * Get current engine/lock status for all vehicles
 */
exports.getAllEngineStatus = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({})
      .populate("lastImmobilizedBy", "name email")
      .select("containerId engineStatus lockStatus lastLocation requiresReauth tamperDetected jammingSuspected")
      .lean();

    res.json({ vehicles });
  } catch (err) {
    logger.error(`Get all engine status error: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch vehicle statuses." });
  }
};
