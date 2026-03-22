/**
 * Event Logger Service
 * Central service that:
 *  1. Hashes the log data (SHA-256)
 *  2. Stores full log in MongoDB
 *  3. Submits hash to blockchain asynchronously
 */

const EventLog = require("../models/EventLog");
const blockchainService = require("./blockchain.service");
const { generateHash } = require("../utils/crypto");
const logger = require("../utils/logger");

/**
 * Create a new event log entry
 * @param {object} params
 * @param {string} params.eventType - One of the EventLog enum values
 * @param {object} params.user - The req.user object (optional)
 * @param {string} params.containerId - Container ID (optional)
 * @param {object} params.details - Arbitrary event payload
 * @param {string} params.outcome - SUCCESS | FAILURE | WARNING | INFO
 * @param {string} params.ipAddress - Client IP
 * @returns {Promise<EventLog>} The saved log document
 */
const createEventLog = async ({
  eventType,
  user = null,
  containerId = null,
  details = {},
  outcome = "INFO",
  ipAddress = null,
}) => {
  try {
    // Build the data payload to be hashed
    const logPayload = {
      eventType,
      userId: user?._id?.toString() || null,
      userRole: user?.role || null,
      containerId,
      details,
      outcome,
      timestamp: new Date().toISOString(),
    };

    const dataHash = generateHash(logPayload);

    // Persist full log to MongoDB
    const eventLog = await EventLog.create({
      eventType,
      userId: user?._id || null,
      userRole: user?.role || null,
      containerId,
      details,
      outcome,
      dataHash,
      ipAddress,
    });

    // Submit hash to blockchain in background (non-blocking)
    // One automatic retry on transient failure — logs full stack for forensics
    setImmediate(async () => {
      const MAX_RETRIES = 2;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const txHash = await blockchainService.logEvent(dataHash, eventType);
          if (txHash) {
            await EventLog.findByIdAndUpdate(eventLog._id, {
              blockchainTxHash: txHash,
              blockchainConfirmed: true,
            });
            logger.info(`⛓️  Blockchain confirmed for log ${eventLog._id} (attempt ${attempt})`);
          }
          break; // Success — exit retry loop
        } catch (err) {
          logger.error(
            `Blockchain log attempt ${attempt}/${MAX_RETRIES} failed for log ${eventLog._id}: ${err.message}`,
            { stack: err.stack, logId: eventLog._id.toString() }
          );
          if (attempt === MAX_RETRIES) {
            logger.error(`⛓️  Blockchain permanently skipped for log ${eventLog._id} after ${MAX_RETRIES} attempts.`);
          }
        }
      }
    });

    return eventLog;
  } catch (err) {
    // Never let logging failures crash the main flow
    logger.error(`Event log creation failed: ${err.message}`);
    return null;
  }
};

module.exports = { createEventLog };
