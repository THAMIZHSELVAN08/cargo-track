/**
 * AI Controller
 * Proxies anomaly detection requests to the Python microservice
 * and provides a manual analysis endpoint
 */

const { analyzeAnomaly, analyzeBatch, checkAIHealth } = require("../services/ai.service");
const { createEventLog } = require("../services/eventLogger.service");
const logger = require("../utils/logger");

/**
 * POST /ai/analyze
 * Manually trigger AI analysis on a GPS data point
 */
exports.analyze = async (req, res) => {
  try {
    const { lat, lng, speed, containerId, timestamp } = req.body;

    const result = await analyzeAnomaly({
      lat, lng, speed,
      containerId,
      timestamp: timestamp || new Date().toISOString(),
    });

    if (result.status === "ANOMALY") {
      await createEventLog({
        eventType: "ANOMALY_DETECTED",
        user: req.user,
        containerId,
        details: { lat, lng, speed, reason: result.reason, score: result.score, source: "MANUAL" },
        outcome: "WARNING",
        ipAddress: req.ip,
      });
    }

    logger.info(`AI analysis: ${result.status} for container ${containerId}`);
    res.json({
      containerId,
      status: result.status,
      reason: result.reason,
      score: result.score,
      analyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`AI analyze error: ${err.message}`);
    res.status(500).json({ error: "AI analysis failed." });
  }
};

/**
 * POST /ai/analyze/batch
 * Analyze multiple GPS points at once
 */
exports.analyzeBatch = async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "data must be a non-empty array." });
    }

    const result = await analyzeBatch(data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Batch analysis failed." });
  }
};

/**
 * GET /ai/health
 * Check if the Python AI microservice is running
 */
exports.healthCheck = async (req, res) => {
  const health = await checkAIHealth();
  res.json({ aiService: health });
};
