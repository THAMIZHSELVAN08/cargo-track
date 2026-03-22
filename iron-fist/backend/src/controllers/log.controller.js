/**
 * Log Controller
 * Retrieves event logs from MongoDB with filtering and pagination
 */

const EventLog = require("../models/EventLog");
const logger = require("../utils/logger");

/**
 * GET /logs
 * Fetch event logs with optional filters
 * Query: ?eventType=LOGIN_SUCCESS&outcome=FAILURE&containerId=C001&limit=20&page=1
 */
exports.getLogs = async (req, res) => {
  try {
    const { eventType, outcome, containerId, userId, limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build dynamic filter
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (outcome) filter.outcome = outcome;
    if (containerId) filter.containerId = containerId;
    if (userId) filter.userId = userId;

    const [logs, total] = await Promise.all([
      EventLog.find(filter)
        .populate("userId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      EventLog.countDocuments(filter),
    ]);

    res.json({ total, page: parseInt(page), limit: parseInt(limit), logs });
  } catch (err) {
    logger.error(`Get logs error: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch logs." });
  }
};

/**
 * GET /logs/:id
 * Fetch a single log entry and its blockchain verification status
 */
exports.getLog = async (req, res) => {
  try {
    const log = await EventLog.findById(req.params.id).populate("userId", "name email role");
    if (!log) return res.status(404).json({ error: "Log not found." });

    res.json({
      log,
      verification: {
        dataHash: log.dataHash,
        blockchainConfirmed: log.blockchainConfirmed,
        blockchainTxHash: log.blockchainTxHash,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch log." });
  }
};

/**
 * GET /logs/stats
 * Get summary statistics for dashboard panels
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await EventLog.aggregate([
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
          lastOccurrence: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalAlerts = await EventLog.countDocuments({
      outcome: "WARNING",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // last 24h
    });

    res.json({ byEventType: stats, alertsLast24h: totalAlerts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch statistics." });
  }
};
