/**
 * AI Service Client
 * Sends GPS telemetry data to the Python FastAPI microservice
 * and returns anomaly detection results
 */

const axios = require("axios");
const logger = require("../utils/logger");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Analyze a GPS data point for anomalies
 * @param {object} params
 * @param {number} params.lat - Latitude
 * @param {number} params.lng - Longitude
 * @param {number} params.speed - Speed in km/h
 * @param {string} params.containerId - Container identifier
 * @param {string} params.timestamp - ISO timestamp
 * @returns {Promise<{ status: string, reason: string, score: number }>}
 */
const analyzeAnomaly = async ({ lat, lng, speed, containerId, timestamp }) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze`,
      { lat, lng, speed, container_id: containerId, timestamp },
      { timeout: 5000 } // 5-second timeout — don't hold up GPS updates
    );

    return {
      status: response.data.status,       // "NORMAL" or "ANOMALY"
      reason: response.data.reason || "", // Human-readable explanation
      score: response.data.score || 0,    // Anomaly score (0-1)
    };
  } catch (err) {
    logger.warn(`AI service unreachable: ${err.message}. Defaulting to UNKNOWN/MEDIUM.`);
    // Graceful degradation: if AI service is down, do NOT give false confidence.
    // MEDIUM forces dispatcher attention without triggering a full ANOMALY alert.
    return { status: "UNKNOWN", risk: "MEDIUM" };
  }
};

/**
 * Analyze a batch of GPS points (for historical analysis)
 * @param {Array} batch - Array of GPS data point objects
 */
const analyzeBatch = async (batch) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze/batch`,
      { data: batch },
      { timeout: 15000 }
    );
    return response.data;
  } catch (err) {
    logger.warn(`AI batch analysis failed: ${err.message}`);
    return { results: batch.map(() => ({ status: "NORMAL", reason: "AI unavailable", score: 0 })) };
  }
};

/**
 * Health check the AI microservice
 */
const checkAIHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
    return response.data;
  } catch {
    return { status: "OFFLINE" };
  }
};

module.exports = { analyzeAnomaly, analyzeBatch, checkAIHealth };
